import { useState } from 'react'

const DocsPage = () => {
  // Use lazy state initializer for one-time redirect
  useState(() => {
    queueMicrotask(() => {
      window.location.href = 'https://docs.maintainerr.info/latest/Introduction'
    })
    return true
  })

  return <div className="text-white">Redirecting to documentation...</div>
}

export default DocsPage
