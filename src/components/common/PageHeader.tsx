import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { SunIcon, MoonIcon, MoreVertical } from "lucide-react";
import SideNavDrawer from "@/components/dashboard/SideNavDrawer";
interface PageHeaderProps {
  title: string;
  subtitle?: string;
}
const PageHeader = ({
  title,
  subtitle
}: PageHeaderProps) => {
  const {
    theme,
    toggleTheme
  } = useTheme();
  return <header className="my-0 py-[15px]">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1 mx-[17px]">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mx-[20px] my-[10px]">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="text-muted-foreground" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </Button>
          <SideNavDrawer>
            <Button size="icon" variant="ghost" className="text-muted-foreground">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </SideNavDrawer>
        </div>
      </div>
    </header>;
};
export default PageHeader;