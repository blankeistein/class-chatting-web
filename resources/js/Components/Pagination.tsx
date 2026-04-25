import { router } from "@inertiajs/react";
import { Button } from "@material-tailwind/react";

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

function getCompactPaginationLinks(links: PaginationLink[]): PaginationLink[] {
  const numberedLinks = links.filter((link) => /^\d+$/.test(link.label));
  const previousLink = links.find((link) => link.label.includes("Previous")) || null;
  const nextLink = links.find((link) => link.label.includes("Next")) || null;
  const activeIndex = numberedLinks.findIndex((link) => link.active);

  if (numberedLinks.length <= 5) {
    return [
      ...(previousLink ? [previousLink] : []),
      ...numberedLinks,
      ...(nextLink ? [nextLink] : []),
    ];
  }

  const windowStart = Math.max(0, activeIndex - 1);
  const windowEnd = Math.min(numberedLinks.length - 1, activeIndex + 1);
  const compactLinks: PaginationLink[] = [];

  if (previousLink) {
    compactLinks.push(previousLink);
  }

  compactLinks.push(numberedLinks[0]);

  if (windowStart > 1) {
    compactLinks.push({ url: null, label: "...", active: false });
  }

  for (let index = Math.max(1, windowStart); index <= Math.min(numberedLinks.length - 2, windowEnd); index += 1) {
    compactLinks.push(numberedLinks[index]);
  }

  if (windowEnd < numberedLinks.length - 2) {
    compactLinks.push({ url: null, label: "...", active: false });
  }

  compactLinks.push(numberedLinks[numberedLinks.length - 1]);

  if (nextLink) {
    compactLinks.push(nextLink);
  }

  return compactLinks;
}


export default function Pagination({ paginated }: { paginated: any }) {
  const paginationLinks = getCompactPaginationLinks(paginated.meta?.links || paginated.links || []);

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-2">
      {paginationLinks.map((link, key) => (
        <Button
          key={key}
          variant={link.active ? "solid" : "ghost"}
          size="sm"
          color={link.active ? "primary" : "secondary"}
          className={`min-w-10 px-3 ${!link.url ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
          disabled={!link.url || link.label === "..."}
        >
          {link.label.includes("Previous") ? "Prev" : link.label.includes("Next") ? "Next" : link.label}
        </Button>
      ))}
    </div>
  )
}
