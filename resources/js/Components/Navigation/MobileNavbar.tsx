import {
  Drawer,
  Typography,
} from "@material-tailwind/react";
import NavList, { LinkType } from "@/Components/Navigation/NavList";

interface Props {
  links: LinkType[];
  open: boolean;
  onOpenChange: () => void
}

export default function MobileNavbar({ links, open, onOpenChange }: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Overlay>
        <Drawer.Panel placement="left">
          <div>
            <div className="flex items-center gap-4 mb-4 px-2">
              <img src="/assets/images/icons/lestari-ilmu.webp" alt="logo" className="h-8 w-8" />
              <Typography
                type="h1"
                className="block py-1 font-bold !text-lg text-surface-foreground whitespace-nowrap overflow-hidden"
              >
                Class Chatting Web
              </Typography>
            </div>
            <NavList links={links} />
          </div>
        </Drawer.Panel>
      </Drawer.Overlay>
    </Drawer>
  )
}
