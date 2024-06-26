'use client'

import React from 'react'

import { useElement } from '../../providers/ElementProvider.js'

export const Heading4 = () => {
  const { attributes, children } = useElement()

  return <h4 {...attributes}>{children}</h4>
}
