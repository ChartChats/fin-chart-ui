import { Layout as AntLayout } from "antd";
import { MainLayout } from "@/components/MainLayout";

const { Content } = AntLayout;

export default function Dashboard() {
  return (
    <AntLayout className="h-screen">
      <Content className="h-full">
        <MainLayout />
      </Content>
    </AntLayout>
  );
}