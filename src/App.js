import {
	BrowserRouter as Router,
		Routes,
		Route
} from "react-router-dom";
import UnderConstruction from "./underConstruction";
import CollectiveOrder from "./collectiveOrder";
import OrdersOverview from "./ordersOverview";
import OrderUpdate from "./orderUpdate";
import Login from "./login";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

export default function App() {

	return (
			<Router>
				  <Routes>
							<Route path="/" element={<UnderConstruction />}/>
							<Route path="/admin" element={<Login />}/>
							<Route path="/admin/orders" element={<OrdersOverview />}/>
							<Route path="/admin/orders/:orderId" element={<OrderUpdate />}/>
							<Route path="/admin/collective_order" element={<CollectiveOrder />}/>
					</Routes>
			</Router>
	)

}
