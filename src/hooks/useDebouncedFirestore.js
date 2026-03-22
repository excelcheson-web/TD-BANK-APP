/**
 * useDebouncedFirestore.js
 * Custom hook for debounced Firestore writes to prevent resource-exhausted errors.
 * Implements 500ms debounce, cleanup, and error handling.
 */

import { useEffect, useRef, useCallback } from 'react'
import { doc, updateDoc, setDoc, onSnapshot, writeBatch } from 'firebase/firestore'
import { db } from '../services/firebaseClient'

// Global write queue to prevent duplicate writes across components
const globalWriteQueue = new Map()
const globalTimeouts = new Map()
const writeFailureCounts = new Map()

const DEBOUNCE_DELAY = 500 // 500ms as recommended
const MAX_FAILURES = 3
const CIRCUIT_BREAKER_TIMEOUT = 300000 // 5 minutes

/**
 * Hook for debounced Firestore document updates
 * @param {string} collection - Firestore collection name
 * @param {string} docId - Document ID
 * @param {Object} options - Hook options
 */
export function useDebouncedDocUpdate(collection, docId, options = {}) {
  const { onError, onSuccess, enabled = true } = options
  
  // Store pending updates
  const pendingDataRef = useRef(null)
  const timeoutRef = useRef(null)
  const isMountedRef = useRef(true)
  const failureCountRef = useRef(0)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const debouncedUpdate = useCallback(async (data) => {
    if (!enabled || !docId) return

    const key = `${collection}/${docId}`
    
    // Check circuit breaker
    const globalFailures = writeFailureCounts.get(key) || 0
    if (globalFailures >= MAX_FAILURES) {
      console.warn(`[useDebouncedDocUpdate] Circuit breaker active for ${key}`)
      onError?.(new Error('Circuit breaker active - too many failures'))
      return
    }

    // Store pending data
    pendingDataRef.current = { ...pendingDataRef.current, ...data }
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Clear global timeout if exists
    if (globalTimeouts.has(key)) {
      clearTimeout(globalTimeouts.get(key))
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      const dataToWrite = pendingDataRef.current
      pendingDataRef.current = null
      
      if (!dataToWrite || !isMountedRef.current) return

      try {
        const docRef = doc(db, collection, docId)
        await updateDoc(docRef, dataToWrite)
        
        // Reset failure counts on success
        failureCountRef.current = 0
        writeFailureCounts.set(key, 0)
        
        if (isMountedRef.current) {
          onSuccess?.(dataToWrite)
        }
      } catch (err) {
        console.error(`[useDebouncedDocUpdate] Write failed for ${key}:`, err.message)
        
        // Increment failure counts
        failureCountRef.current++
        writeFailureCounts.set(key, (writeFailureCounts.get(key) || 0) + 1)
        
        if (isMountedRef.current) {
          onError?.(err)
        }
        
        // Check for resource-exhausted specifically
        if (err.code === 'resource-exhausted') {
          console.error('[useDebouncedDocUpdate] Firestore quota exceeded!')
        }
      }
    }, DEBOUNCE_DELAY)
    
    // Store timeout reference globally
    globalTimeouts.set(key, timeoutRef.current)
  }, [collection, docId, enabled, onError, onSuccess])

  return { debouncedUpdate }
}

/**
 * Hook for real-time Firestore document listening with proper cleanup
 * @param {string} collection - Firestore collection name
 * @param {string} docId - Document ID
 * @param {Object} options - Hook options
 */
export function useFirestoreDoc(collection, docId, options = {}) {
  const { onData, onError, enabled = true } = options
  
  const unsubscribeRef = useRef(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    
    if (!enabled || !docId) {
      return () => {
        isMountedRef.current = false
        if (unsubscribeRef.current) {
          unsubscribeRef.current()
          unsubscribeRef.current = null
        }
      }
    }

    const docRef = doc(db, collection, docId)
    
    // Set up listener with error handling
    unsubscribeRef.current = onSnapshot(
      docRef,
      (snapshot) => {
        if (!isMountedRef.current) return
        
        if (snapshot.exists()) {
          onData?.({ id: snapshot.id, ...snapshot.data() })
        } else {
          onData?.(null)
        }
      },
      (err) => {
        if (!isMountedRef.current) return
        
        console.error(`[useFirestoreDoc] Listen error for ${collection}/${docId}:`, err.message)
        onError?.(err)
        
        // Check for resource-exhausted
        if (err.code === 'resource-exhausted') {
          console.error('[useFirestoreDoc] Firestore quota exceeded for listeners!')
        }
      }
    )

    // Cleanup function
    return () => {
      isMountedRef.current = false
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [collection, docId, enabled, onData, onError])

  // Return cleanup function for manual use
  return {
    unsubscribe: () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }
}

/**
 * Batch write multiple documents efficiently
 * @param {Array} operations - Array of {collection, docId, data} objects
 * @param {Object} options - Options
 */
export async function batchWrite(operations, options = {}) {
  const { onError, onSuccess } = options
  
  if (!operations || operations.length === 0) return
  
  const batch = writeBatch(db)
  
  operations.forEach(op => {
    const docRef = doc(db, op.collection, op.docId)
    if (op.merge) {
      batch.set(docRef, op.data, { merge: true })
    } else {
      batch.update(docRef, op.data)
    }
  })
  
  try {
    await batch.commit()
    onSuccess?.()
    return true
  } catch (err) {
    console.error('[batchWrite] Batch write failed:', err.message)
    onError?.(err)
    
    if (err.code === 'resource-exhausted') {
      console.error('[batchWrite] Firestore quota exceeded!')
    }
    return false
  }
}

/**
 * Safe Firestore write with retry logic
 * @param {Function} operation - Firestore operation function
 * @param {number} maxRetries - Maximum retry attempts
 */
export async function safeWrite(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (err) {
      console.warn(`[safeWrite] Attempt ${attempt} failed:`, err.message)
      
      if (err.code === 'resource-exhausted') {
        console.error('[safeWrite] Resource exhausted - backing off')
        // Longer backoff for resource exhaustion
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
      } else if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt))
      } else {
        throw err
      }
    }
  }
}
