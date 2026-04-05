export type SidebarPosition = 'left' | 'right';
export type ThemeMode = 'light' | 'dark' | 'system';

export type SidebarConfig = {
  position: SidebarPosition;
  width: number;
};

export type AppConfig = {
  sidebar: SidebarConfig;
  theme: ThemeMode;
};

export type ConfigPatch = {
  sidebar?: Partial<SidebarConfig>;
  theme?: AppConfig['theme'];
};
