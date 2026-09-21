import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import axiosInstance from "../../api/axios";

type PublicFeature = "publicWebsite" | "onlineBooking";

const PublicFeatureGate: React.FC<{ feature: PublicFeature; children: React.ReactNode }> = ({ feature, children }) => {
  const location = useLocation();
  const { shopSlug } = useParams();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const slug = shopSlug || new URLSearchParams(location.search).get("shop");
  useEffect(() => {
    let current = true;
    setLoading(true);
    setShop(null);
    axiosInstance.get("/public/shop", { params: slug ? { shop: slug } : undefined })
      .then((response) => { if (current) setShop(response.data); })
      .catch(() => { if (current) setShop(null); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [slug]);
  if (loading) return <div className="public-gate-loading"><img src="/mirror.svg" alt=""/> Loading shop…</div>;
  if (shop?.slug === slug && shop?.features?.[feature]) return <React.Fragment key={slug}>{children}</React.Fragment>;
  return <main className="public-gate-page"><span><img src="/mirror.svg" alt=""/></span><p>MIRROR</p><h1>Online booking is not available now.</h1><p>Please contact the shop directly.</p><Link to="/">About Mirror</Link></main>;
};

export default PublicFeatureGate;
