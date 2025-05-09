
import { Layout as AntLayout, theme } from "antd";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LayoutControls } from "@/components/LayoutControls";
import { DraggableLayout } from "@/components/DraggableLayout";
import { useIsMobile } from "@/hooks/use-mobile";

const { Header, Content } = AntLayout;

export default function Dashboard() {
  const isMobile = useIsMobile();
  const { token } = theme.useToken();

  return (
    <AntLayout className="min-h-screen">
      <Header 
        style={{ 
          background: token.colorBgContainer, 
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          padding: '0 16px'
        }}
      >
        <div className="container flex h-14 sm:h-16 items-center justify-between py-2">
          <h1 className="text-lg sm:text-xl font-bold">ChartChat</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            {!isMobile && <LayoutControls />}
            <ThemeToggle />
          </div>
        </div>
      </Header>
      <Content className="px-4 py-4 h-[calc(100vh-72px)]">
        <DraggableLayout />
      </Content>
    </AntLayout>
  );
}