import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { paths } from "@/config/paths";
import "./LandingPage.css";
import { SignInIcon } from "@phosphor-icons/react";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    navigate(paths.auth.login.path);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 overflow-hidden">
      {/* Đốm bên trái */}
      <div className="absolute -top-30 -left-40 w-150 h-150 bg-sky-500/30 rounded-full filter blur-[120px] animate-float z-0"></div>

      {/* Đốm bên phải */}
      <div className="absolute -bottom-30 -right-30 w-150 h-150 bg-blue-400/25 rounded-full filter blur-[130px] animate-float-delayed z-0"></div>

      {/* Nội dung */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mt-[-5vh]">
        {/* Tiêu đề */}
        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-[#111827] mb-6 leading-tight">
          Chào mừng đến với {" "}
          <span className="text-primary/80">
            Hệ thống <br /> Phòng họp thông minh
          </span>
        </h1>

        <Button
          className="h-14 w-48 z-1 px-8 text-xl font-semibold rounded-xl shadow-lg shadow-black-500/30 transition-all active:scale-[0.98] flex items-center gap-2"
          onClick={handleGoToLogin}
        >
          Đăng nhập
          <SignInIcon
            weight="bold"
            className="w-8 h-8 mt-1"
          />
        </Button>
      </div>
    </div>
  );
}
