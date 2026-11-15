import React from 'react'

const paths = {
  cloud: 'M6 18a4 4 0 1 1 .7-7.9 5.5 5.5 0 0 1 10.6 1.1A3.5 3.5 0 1 1 18 18Z',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z',
  storage: 'M4 13 6 5h12l2 8v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Zm0 0h16m-4 3h1',
  sparkle: 'M10 3 12.1 8.9 18 11l-5.9 2.1L10 19l-2.1-5.9L2 11l5.9-2.1ZM19 13v6m-3-3h6',
  upload: 'M12 16V3m-5 5 5-5 5 5M4 16v4h16v-4',
  search: 'M20 20l-4-4m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
  file: 'M6 3h8l4 4v14H6Zm8 0v5h4M9 13h6m-6 4h6',
  image: 'M3 4h18v16H3Zm0 13 5-5 4 4 3-3 6 6M15 8h.01',
  video: 'M3 6h12v12H3Zm12 4 6-4v12l-6-4',
  audio: 'M9 18V6l11-2v12M9 18a3 2 0 1 1-6 0 3 2 0 0 1 6 0Zm11-2a3 2 0 1 1-6 0 3 2 0 0 1 6 0Z',
  archive: 'M4 8h16v12H4ZM3 4h18v4H3Zm7 8h4',
  download: 'M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4',
  trash: 'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15m-8 4v7m4-7v7',
  logout: 'M10 4H4v16h6m-1-8h12m-4-4 4 4-4 4',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  close: 'm6 6 12 12M18 6 6 18'
}

export function Icon({ name, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}

export function Brand() {
  return <div className="brand"><span className="brand-mark"><Icon name="cloud" size={22} /></span>Personal Cloud <span className="brand-ai">AI</span></div>
}
