export interface BreadcrumbItem {
  text: string;
  href: string;
  color?: string;
  ariaCurrent?: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';
  handleClick: (e: React.MouseEvent, href: string) => void;
}

interface BreadcrumbProps {
  data: BreadcrumbItem[];
}

export const Breadcrumb = ({ data }: BreadcrumbProps) => {
  return (
    <nav className="breadcrumb-legacy" aria-label="Breadcrumb">
      <ol style={{ display: "flex", listStyle: "none", padding: 0, margin: 0 }}>
        {data.map((item, index) => (
          <li key={item.href}>
            {index > 0 && <span className="breadcrumb-separator">/</span>}
            <a
              href={item.href}
              onClick={(e) => item.handleClick(e, item.href)}
              aria-current={item.ariaCurrent}
              className="breadCrumb-content-block"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
};