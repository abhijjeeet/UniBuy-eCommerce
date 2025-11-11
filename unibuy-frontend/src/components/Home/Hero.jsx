import { useEffect, useMemo, useRef, useState } from "react";


 const usePrefersReducedMotion = () => {
        const [prefers, setPrefers] = useState(false);
        useEffect(() => {
            const q = window.matchMedia("(prefers-reduced-motion: reduce)");
            const onChange = () => setPrefers(q.matches);
            onChange(); q.addEventListener?.("change", onChange);
            return () => q.removeEventListener?.("change", onChange);
        }, []);
        return prefers;
    };

/* Hero: slim like Flipkart */
const Hero = () => {

   

    const prefers = usePrefersReducedMotion();
    const slides = useMemo(() => [
        {
            title: "Festive Offers Are Live",
            subtitle: "Up to 60% off on top categories",
            image: "https://rukminim2.flixcart.com/fk-p-flap/3240/540/image/48fede5e1b0e76f7.jpg?q=60",
        },
        {
            title: "Segment Best Deals",
            subtitle: "Mobiles, Laptops, Headphones & more",
            image: "https://rukminim2.flixcart.com/fk-p-flap/3240/540/image/5b309e98775e22e4.jpg?q=60",
        },
        {
            title: "Festive Offers Are Live",
            subtitle: "Up to 60% off on top categories",
            image: "https://rukminim2.flixcart.com/fk-p-flap/3240/540/image/6d5146f6ddc9d445.jpeg?q=60",
        },
        {
            title: "Festive Offers Are Live",
            subtitle: "Up to 60% off on top categories",
            image: "https://rukminim2.flixcart.com/fk-p-flap/3240/540/image/5b5b5fe05e8df405.jpg?q=60",
        },

        {
            title: "Festive Offers Are Live",
            subtitle: "Up to 60% off on top categories",
            image: "https://rukminim2.flixcart.com/fk-p-flap/3240/540/image/6d5146f6ddc9d445.jpeg?q=60",
        },
    ], []);
    const [i, setI] = useState(0);
    const t = useRef(null);
    const go = (d) => setI((p) => (p + d + slides.length) % slides.length);
    const play = () => { if (!prefers) t.current = setInterval(() => go(1), 6000); };
    const stop = () => t.current && clearInterval(t.current);
    useEffect(() => { play(); return stop; }, [prefers]);

    return (
        <section className="relative h-[220px] md:h-[260px] lg:h-[280px] overflow-hidden rounded-md mt-3"
            onMouseEnter={stop} onMouseLeave={play}>
            {slides.map((s, idx) => (
                <div key={idx}
                    className={`absolute inset-0 transition-opacity duration-700 ${idx === i ? "opacity-100" : "opacity-0"}`}>
                    <img src={`${s.image}&w=1600`} alt="" className="h-full w-full object-cover" />
                    <div className={`absolute inset-0 bg-gradient-to-r ${s.gradient}`} />
                    <div className="absolute inset-0 flex items-center pl-10">
                        <div className="max-w-xl">
                            {/* <h2 className="text-2xl lg:text-3xl font-bold text-white mb-1">{s.title}</h2>
              <p className="text-white/90 text-sm lg:text-base mb-3">{s.subtitle}</p>
              <a href="#products" className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full text-sm font-semibold text-indigo-700 hover:scale-105">
                Explore <ArrowRight size={16} />
              </a> */}
                        </div>
                    </div>
                </div>
            ))}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, idx) => (
                    <button key={idx} onClick={() => setI(idx)}
                        className={`h-1.5 rounded-full ${idx === i ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white"}`} />
                ))}
            </div>
        </section>
    );
};

export default Hero;