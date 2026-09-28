import { Layout } from "./components/Layout";
import { useRoute } from "./lib/router";
import { Connections } from "./pages/Connections";
import { Costs } from "./pages/Costs";
import { DepartmentDetail, Departments, ProductDetail, Products, UserDetail, Users } from "./pages/Entities";
import { FindingDetail, Findings } from "./pages/Findings";
import { Live } from "./pages/Live";
import { Overview } from "./pages/Overview";
import { Security } from "./pages/Security";
import { Settings } from "./pages/Settings";
import { Usage } from "./pages/Usage";

export function App() {
  const [section, id] = useRoute();
  const page = (() => {
    switch (section) {
      case "findings": return id ? <FindingDetail id={id} /> : <Findings />;
      case "live": return <Live />;
      case "costs": return <Costs />;
      case "security": return <Security />;
      case "usage": return <Usage />;
      case "products": return id ? <ProductDetail id={id} /> : <Products />;
      case "users": return id ? <UserDetail id={id} /> : <Users />;
      case "departments": return id ? <DepartmentDetail id={id} /> : <Departments />;
      case "connections": return <Connections />;
      case "settings": return <Settings />;
      default: return <Overview />;
    }
  })();
  return <Layout route={section}>{page}</Layout>;
}
