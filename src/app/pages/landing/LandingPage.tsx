import { Button } from "@/components/ui/button";
import { SignInIcon } from "@phosphor-icons/react";
import Grainient from "@/components/Grainient";
import "./LandingPage.css";
import { useAuth } from "@/hooks/use-auth";
import ShinyText from "@/components/ShinyText";

export default function LandingPage() {
  const { login } = useAuth();
  const handleGoToLogin = () => {
    login();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 overflow-hidden">
      {/* Đốm bên trái */}
      {/* <div className="absolute -top-30 -left-40 w-150 h-150 bg-sky-500/30 rounded-full filter blur-[120px] animate-float z-0"></div> */}

      {/* Đốm bên phải */}
      {/* <div className="absolute -bottom-30 -right-30 w-150 h-150 bg-blue-400/25 rounded-full filter blur-[130px] animate-float-delayed z-0"></div> */}
      <div className="absolute inset-0 z-0 w-full h-full pointer-events-none">
        <Grainient
          color1="#7dbbfd"
          color2="#c6ebff"
          color3="#6ab6f9"
          timeSpeed={1.55}
          colorBalance={-0.36}
          warpStrength={2.55}
          warpFrequency={5}
          warpSpeed={2}
          warpAmplitude={50}
          blendAngle={0}
          blendSoftness={0.21}
          rotationAmount={500}
          noiseScale={1}
          grainAmount={0.1}
          grainScale={0.2}
          grainAnimated={false}
          contrast={1.5}
          gamma={1}
          saturation={1}
          centerX={0}
          centerY={0}
          zoom={0.8}
        />
      </div>
      {/* Nội dung */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mt-[-5vh]">
        {/* Tiêu đề */}
        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-[#111827] mb-6 leading-tight">
          Chào mừng đến với&nbsp;
          <span className="text-primary/80">
            Hệ thống <br />
            <ShinyText
              text="Phòng họp thông minh"
              speed={2.4}
              delay={0}
              color="#2EA1FF"
              shineColor="#93cefc"
              spread={120}
              direction="left"
              yoyo={false}
              pauseOnHover={false}
              disabled={false}
            />
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
