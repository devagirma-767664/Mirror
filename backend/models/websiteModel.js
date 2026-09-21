const pool=require('../db');

const domain=()=>String(process.env.PUBLIC_WEBSITE_DOMAIN||'').trim().toLowerCase().replace(/^https?:\/\//,'').replace(/\/$/,'');
const publicUrl=subdomain=>{
  const configured=domain();
  return configured&&subdomain?`https://${subdomain}.${configured}`:null;
};

// Public-site data is retained for any existing externally managed shop website.
// Website planning, assets and publication are deliberately not managed in Mirror.
const Website={
  publicUrl,
  async publicConfig(shopId) {
    const brief=(await pool.query(`SELECT b.template_code AS "templateCode",b.style,b.theme,b.palette,b.custom_colors AS "customColors",b.primary_goal AS "primaryGoal",
      b.hero_title AS "heroTitle",b.introduction,b.instagram,b.tiktok
      FROM website_briefs b JOIN website_requests r ON r.shop_id=b.shop_id
      WHERE b.shop_id=$1 AND b.status IN ('submitted','in_review','ready') AND r.status='ready'`,[shopId])).rows[0];
    if(!brief)return null;
    brief.assets=(await pool.query(`SELECT kind,file_path AS "filePath" FROM website_brief_assets a
      JOIN website_briefs b ON b.id=a.brief_id WHERE b.shop_id=$1 ORDER BY kind,created_at`,[shopId])).rows;
    return brief;
  },
};

module.exports=Website;
