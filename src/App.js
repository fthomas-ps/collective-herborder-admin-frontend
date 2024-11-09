import {useState} from 'react';
import {
	BrowserRouter as Router,
		Routes,
		Route
} from "react-router-dom";
import {useCookies} from "react-cookie";
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import CssBaseline from '@mui/material/CssBaseline';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import UnderConstruction from "./underConstruction";
import Overview from "./overview";
import OrderUpdate from "./orderUpdate";
import OrdersOverview from "./ordersOverview";
import Bill from "./bill";
import ShipmentsOverview from "./shipmentsOverview";
import ShipmentUpdate from "./shipmentUpdate";
import Login from "./login";
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ViewListIcon from '@mui/icons-material/ViewList';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LogoutIcon from '@mui/icons-material/Logout';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

export default function App() {

	const [cookies, setCookies, removeCookies] = useCookies(['herbauth']);
	const [drawerOpen, setDrawerOpen] = useState(false);

	function toggleDrawer(desiredState) {
		setDrawerOpen(desiredState);
	}

	function toggleDrawer() {
		setDrawerOpen(!drawerOpen);
	}

	function logout() {
		removeCookies('herbauth');
	}

	return (
	<Box sx={{ display: 'flex' }}>
		<CssBaseline />
		<AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} color="primary">
			<Toolbar>
				{
					cookies.herbauth !== undefined ? (
							<IconButton
									size="large"
									edge="start"
									color="inherit"
									sx={{
										marginRight: 2,
										display: {xs: 'inline-flex', sm: 'none'}
									}}
									onClick={() => toggleDrawer()}
							>
								<MenuIcon/>
							</IconButton>
							) : <></>
				}
				<Typography variant="h6" component="div" sx={{flexGrow: 1}}>
					Kräuterbestellung 2025
				</Typography>
				{
					cookies.herbauth !== undefined ?
							<IconButton color="inherit" onClick={logout}>
								<LogoutIcon/>
							</IconButton>
							: <></>

				}
			</Toolbar>
		</AppBar>

		{
			cookies.herbauth !== undefined ?
					(
							<>
								<Drawer
										variant="permanent"
										sx={{
											display: {xs: 'none', sm: 'block'},
											width: 250,
											flexShrink: 0,
											[`& .MuiDrawer-paper`]: {
												width: 250,
												boxSizing: 'border-box'
											},
										}}
								>
									<Toolbar/>
									<Box sx={{overflow: 'auto'}}>
										<MenuItems/>
									</Box>
								</Drawer>
								<Drawer open={drawerOpen} onClose={() => toggleDrawer(false)}>
									<Box
											sx={{
												width: 250,
												paddingTop: 8
											}}
											role="presentation"
											onClick={() => toggleDrawer(false)}>
										<MenuItems logout={{test: "hello"}}/>
									</Box>
								</Drawer>
							</>
					) : <></>
		}

	<Router>
			<Routes>
				<Route path="/" element={<UnderConstruction/>}/>
				<Route path="/admin" element={<Login/>}/>
				<Route path="/admin/overview" element={<Overview/>}/>
				<Route path="/admin/orders" element={<OrdersOverview/>}/>
				<Route path="/admin/bill" element={<Bill/>}/>
				<Route path="/admin/shipments" element={<ShipmentsOverview/>}/>
				<Route path="/admin/shipments/new" element={<ShipmentUpdate/>}/>
				<Route path="/admin/shipments/:shipmentId" element={<ShipmentUpdate/>}/>
				<Route path="/admin/orders/:orderId" element={<OrderUpdate/>}/>
			</Routes>
		</Router>

	</Box>
	)

	function MenuItems() {
		return (
				<List>
					<ListItem>
						<ListItemButton href="/admin/overview">
							<ListItemIcon sx={{ minWidth: '42px' }}>
								<ViewListIcon/>
							</ListItemIcon>
							<ListItemText primary="Übersicht"/>
						</ListItemButton>
					</ListItem>
					<ListItem>
						<ListItemButton href="/admin/orders">
							<ListItemIcon sx={{ minWidth: '42px' }}>
								<ShoppingCartIcon/>
							</ListItemIcon>
							<ListItemText primary="Einzelbestellungen"/>
						</ListItemButton>
					</ListItem>
					<ListItem>
						<ListItemButton href="/admin/bill">
							<ListItemIcon sx={{ minWidth: '42px' }}>
								<ReceiptIcon/>
							</ListItemIcon>
							<ListItemText primary="Sammelrechnung"/>
						</ListItemButton>
					</ListItem>
					<ListItem>
						<ListItemButton href="/admin/shipments">
							<ListItemIcon sx={{ minWidth: '42px' }}>
								<LocalShippingIcon/>
							</ListItemIcon>
							<ListItemText primary="Lieferungen"/>
						</ListItemButton>
					</ListItem>
					<ListItem>
						<ListItemButton onClick={logout}>
							<ListItemIcon sx={{ minWidth: '42px' }}>
								<LogoutIcon/>
							</ListItemIcon>
							<ListItemText primary="Abmelden"/>
						</ListItemButton>
					</ListItem>
				</List>
		)

	}

}

