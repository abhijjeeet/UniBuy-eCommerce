import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";

export default function UserLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1  ">
        <Outlet />
      </main>
      <Footer/>
    </div>
  );
}