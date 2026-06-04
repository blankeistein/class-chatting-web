import { IconButton, Typography } from "@material-tailwind/react";
import { GithubIcon } from "lucide-react";

export default function Footer() {
  return (
    <footer className="p-2 flex items-center justify-between border-t border-surface mt-auto">
      <Typography className="text-sm text-surface-foreground/60">
        &copy; {new Date().getFullYear()} All rights reserved. Class Chatting Web
      </Typography>
      <IconButton
        variant="ghost"
        size="sm"
        as="a"
        href="https://github.com/blankeistein"
        target="_blank"
      >
        <GithubIcon className="h-4 w-4" />
      </IconButton>
    </footer>
  )
}
