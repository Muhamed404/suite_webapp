export interface NavItem {
  href: string;
  label: string;
}

export interface SiteLinks {
  twitter: string;
  discord: string;
  github: string;
  sponsor: string;
}

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Junior Magnus",
  description: "Junior Magnus — Videos, comics & cybersafe learning for kids",
  navItems: [] as NavItem[],
  navMenuItems: [] as NavItem[],
  links: {
    twitter: "#",
    discord: "#",
    github: "#",
    sponsor: "#",
  } as SiteLinks,
};
