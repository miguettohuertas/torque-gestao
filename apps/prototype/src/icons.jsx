// ─────────────────────────────────────────────────────────────────
// icons.jsx — SVG icon components (Feather / Lucide style)
// Must be loaded before shared.jsx so STATUS_CFG can reference them.
// ─────────────────────────────────────────────────────────────────

const Ic = ({size=16,color='currentColor',children}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{flexShrink:0,display:'inline-block',verticalAlign:'middle'}}>
    {children}
  </svg>
);

// ── Navigation & Layout ──────────────────────────────────────────
const IcGrid      = p => <Ic {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></Ic>;
const IcArrowLeft = p => <Ic {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></Ic>;
const IcLogOut    = p => <Ic {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Ic>;

// ── Actions ───────────────────────────────────────────────────────
const IcPlus      = p => <Ic {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ic>;
const IcSearch    = p => <Ic {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Ic>;
const IcCalendar  = p => <Ic {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Ic>;

// ── Entities ──────────────────────────────────────────────────────
const IcClipboard = p => <Ic {...p}><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></Ic>;
const IcUsers     = p => <Ic {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Ic>;
const IcUser      = p => <Ic {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Ic>;
const IcCar       = p => <Ic {...p}><path d="M5 11L7 6h10l2 5"/><rect x="2" y="11" width="20" height="7" rx="2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></Ic>;
const IcBox       = p => <Ic {...p}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></Ic>;

// ── Status & Feedback ─────────────────────────────────────────────
const IcCheck       = p => <Ic {...p}><polyline points="20 6 9 17 4 12"/></Ic>;
const IcX           = p => <Ic {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Ic>;
const IcAlert       = p => <Ic {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Ic>;
const IcWrench      = p => <Ic {...p}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></Ic>;
const IcFlag        = p => <Ic {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></Ic>;
const IcCheckCircle = p => <Ic {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Ic>;

// ── Settings & System ─────────────────────────────────────────────
const IcCog      = p => <Ic {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></Ic>;
const IcClock    = p => <Ic {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Ic>;
const IcBuilding = p => <Ic {...p}><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18H6z"/><path d="M2 22h20"/><path d="M10 7h4"/><path d="M10 11h4"/><path d="M10 15h4"/></Ic>;
const IcBell     = p => <Ic {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Ic>;
const IcLock     = p => <Ic {...p}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Ic>;
const IcInfo     = p => <Ic {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Ic>;
const IcPhone    = p => <Ic {...p}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></Ic>;
const IcMapPin   = p => <Ic {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></Ic>;

// ── Status icon resolver ──────────────────────────────────────────
const STATUS_ICON_MAP = {
  'Aguardando Diagnóstico': IcSearch,
  'Em Execução':            IcWrench,
  'Aguardando Peças':       IcBox,
  'Finalizada':             IcCheckCircle,
  'Entregue':               IcFlag,
  'Cancelada':              IcX,
};
const StatusIcon = ({status, size=16, color='currentColor'}) => {
  const Icon = STATUS_ICON_MAP[status] || IcWrench;
  return <Icon size={size} color={color}/>;
};

Object.assign(window, {
  IcGrid, IcArrowLeft, IcLogOut,
  IcPlus, IcSearch, IcCalendar,
  IcClipboard, IcUsers, IcUser, IcCar, IcBox,
  IcCheck, IcX, IcAlert, IcWrench, IcFlag, IcCheckCircle,
  IcCog, IcClock, IcBuilding, IcBell, IcLock, IcInfo, IcPhone, IcMapPin,
  StatusIcon,
});
