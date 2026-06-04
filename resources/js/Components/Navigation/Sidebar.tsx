import {
  Card,
  IconButton,
  Typography,
} from "@material-tailwind/react";
import NavList, { LinkType } from "./NavList";
import { ReactNode } from "react";

interface Props {
  links: LinkType[];
  isCollapsed?: boolean;
  footer?: ReactNode;
}

export default function Sidebar({ links, isCollapsed, footer }: Props) {

  return (
    <div className={`p-2 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-[280px]'} hidden lg:block overflow-hidden`}>
      <Card className="h-full max-h-screen">
        <Card.Header className={`flex items-center gap-4 mb-0 mt-3 h-max transition-all duration-300 ${isCollapsed ? 'mx-1 px-1 justify-center' : 'mx-4'}`}>
          <img src="/assets/images/icons/lestari-ilmu.webp" alt="logo" className="h-8 w-8 flex-shrink-0" />

          {!isCollapsed && (
            <Typography
              type="h1"
              className="block py-1 font-bold !text-lg text-surface-foreground whitespace-nowrap overflow-hidden"
            >
              Class Chatting Web
            </Typography>
          )}
        </Card.Header>
        <Card.Body className={`p-4 mt-2 ${isCollapsed ? 'px-2' : ''}`}>
          <NavList links={links} isCollapsed={isCollapsed} />
        </Card.Body>
        {
          footer &&
          <Card.Footer>
            {footer}
          </Card.Footer>
        }
      </Card>
    </div>
  );
}
