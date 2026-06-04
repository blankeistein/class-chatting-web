import React, { useEffect, useState } from "react";
import {
  Chip,
  Collapse,
  List,
  Menu,
  Tooltip,
  Typography,
} from "@material-tailwind/react";
import { ChevronDownIcon, } from "lucide-react";
import { Link, usePage } from "@inertiajs/react";
import { route } from "ziggy-js";

export type ChildLinkType = {
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
  title: string;
  routeName: string;
  badge?: number;
};

export type LinkType = {
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
  title: string;
  href?: string;
  routeName?: string;
  badge?: number;
  children?: ChildLinkType[];
};

interface Props {
  links: LinkType[];
  isCollapsed?: boolean;
}

const isCurrentRoute = (routeName: string): boolean => {
  return route().current(routeName);
};

export default function NavList({ links, isCollapsed = false }: Props) {
  const { url } = usePage();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    links.reduce<Record<string, boolean>>((groups, link) => {
      if (link.children) {
        groups[link.title] = link.children.some(({ routeName }) => isCurrentRoute(routeName));
      }

      return groups;
    }, {}),
  );

  useEffect(() => {
    setOpenGroups((currentGroups) =>
      links.reduce<Record<string, boolean>>((groups, link) => {
        if (link.children) {
          const hasActiveChild = link.children.some(({ routeName }) => isCurrentRoute(routeName));
          groups[link.title] = currentGroups[link.title] || hasActiveChild;
        }

        return groups;
      }, {}),
    );
  }, [url]);

  const toggleGroup = (title: string): void => {
    setOpenGroups((currentGroups) => ({
      ...currentGroups,
      [title]: !currentGroups[title],
    }));
  };

  return (
    <List>
      {links.map(({ icon: Icon, title, href, routeName, badge, children }) => {
        const isSelected = routeName ? route().current(routeName + '*') : false;
        const hasChildren = Boolean(children?.length);
        const hasActiveChild = children?.some((child) => isCurrentRoute(child.routeName)) ?? false;
        const isGroupOpen = openGroups[title] ?? false;

        if (hasChildren && children) {
          if (isCollapsed) {
            return (
              <Menu key={title} placement="right-start">
                <Menu.Trigger as="div" className="aspect-square w-10 h-10">
                  <List.Item
                    selected={hasActiveChild}
                    className="aspect-square w-10 h-10 justify-center p-0 flex shrink-0 cursor-pointer"
                  >
                    <Icon className="h-[20px] w-[20px]" />
                  </List.Item>
                </Menu.Trigger>
                <Menu.Content className="z-20 min-w-52">
                  <Typography type="small" className="px-3 pt-1 pb-2 font-semibold text-surface-foreground/70">
                    {title}
                  </Typography>
                  {children.map((child) => {
                    const isChildSelected = isCurrentRoute(child.routeName);

                    return (
                      <Menu.Item
                        key={child.title}
                        as={Link}
                        href={route(child.routeName)}
                        className={isChildSelected ? "bg-primary/10 text-primary" : ""}
                      >
                        {child.title}
                      </Menu.Item>
                    );
                  })}
                </Menu.Content>
              </Menu>
            );
          }

          return (
            <div key={title}>
              <List.Item selected={hasActiveChild} onClick={() => toggleGroup(title)} className="cursor-pointer">
                <List.ItemStart>
                  <Icon className="h-[18px] w-[18px]" />
                </List.ItemStart>
                {title}
                <List.ItemEnd>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isGroupOpen ? "rotate-180" : ""}`} />
                </List.ItemEnd>
              </List.Item>
              <Collapse open={isGroupOpen}>
                <div className="mt-1 flex flex-col gap-1 pl-3">
                  {children.map((child) => {
                    const isChildSelected = isCurrentRoute(child.routeName);

                    return (
                      <List.Item
                        key={child.title}
                        as={Link}
                        href={route(child.routeName)}
                        selected={isChildSelected}
                        className="pl-10"
                      >
                        <List.ItemStart>
                          {child.icon && <child.icon className="h-[18px] w-[18px]" />}
                        </List.ItemStart>
                        {child.title}
                        {child.badge && (
                          <List.ItemEnd>
                            <Chip size="sm" variant="ghost">
                              <Chip.Label>{child.badge}</Chip.Label>
                            </Chip>
                          </List.ItemEnd>
                        )}
                      </List.Item>
                    );
                  })}
                </div>
              </Collapse>
            </div>
          );
        }

        const listItem = (
          <List.Item
            key={title}
            as={Link}
            href={routeName ? route(routeName) : href || '#'}
            selected={isSelected}
            className={isCollapsed ? "aspect-square w-10 h-10 justify-center p-0 flex shrink-0" : ""}
          >
            {isCollapsed ? (
              <Icon className="h-[20px] w-[20px]" />
            ) : (
              <>
                <List.ItemStart>
                  <Icon className="h-[18px] w-[18px]" />
                </List.ItemStart>
                {title}
                {badge && (
                  <List.ItemEnd>
                    <Chip size="sm" variant="ghost">
                      <Chip.Label>{badge}</Chip.Label>
                    </Chip>
                  </List.ItemEnd>
                )}
              </>
            )}
          </List.Item>
        );

        if (isCollapsed) {
          return (
            <Tooltip key={title} placement="right">
              <Tooltip.Trigger as="div" className="aspect-square w-10 h-10 ">
                {listItem}
              </Tooltip.Trigger>
              <Tooltip.Content>
                {title}
                <Tooltip.Arrow />
              </Tooltip.Content>
            </Tooltip>
          );
        }

        return listItem;
      })}
    </List>
  )
}
