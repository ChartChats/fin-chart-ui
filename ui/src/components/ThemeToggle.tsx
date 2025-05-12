import { Button } from "antd";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button 
      type="text"
      shape="circle" 
      icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
      onClick={toggleTheme} 
      aria-label="Toggle theme"
      className="w-full h-6 min-w-0 flex items-center justify-center"
      style={{ padding: 0 }}
    />
  );
}
