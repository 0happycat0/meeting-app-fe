import { Button } from "@/components/ui/button";
import { useState } from "react";
import reactLogo from "@/assets/react.svg";
import viteLogo from "@/assets/vite.svg";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    console.log("Đang xử lý một vài logic hệ thống phòng họp...");
    // Sau khi xử lý xong thì gọi navigate để chuyển trang
    navigate("/login");
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <p>count is {count}</p>
        <div className="justify-center">
          <Button
            variant="default"
            onClick={() => setCount((count) => count + 1)}
          >
            Click me
          </Button>
          <Button variant="outline" onClick={handleGoToLogin}>
            Đến Đăng nhập
          </Button>
        </div>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}
