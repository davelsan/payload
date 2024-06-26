'use client'

import React from 'react'

import { useElement } from '../../providers/ElementProvider.js'

export const Heading1 = () => {
  const { attributes, children } = useElement()

  return <h1 {...attributes}>{children}</h1>
}
