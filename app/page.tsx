import { cookies, headers } from "next/headers"; import { ArenaHome } from "./ui";
export default async function Home(){const c=await cookies(),h=await headers();const language=c.get("oga-language")?.value??(h.get("accept-language")?.toLowerCase().startsWith("es")?"es":"en");return <ArenaHome language={language==="es"?"es":"en"}/>;}
