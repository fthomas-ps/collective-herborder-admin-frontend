import {useState} from 'react';
import {useEffect} from 'react';
import {Navigate, useParams} from "react-router-dom";
import humps from 'humps';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/system/Stack';
import { styled } from '@mui/system';
import Box from '@mui/system/Box';
import Grid from '@mui/system/Grid';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import './styles.css';
import {useCookies} from "react-cookie";

const Item = styled('div')(({ theme }) => ({
	width: '100%',
	height: '100%',
	backgroundColor: '#fff',
	//border: '1px solid',
	//borderColor: '#ced7e0',
	padding: theme.spacing(1),
	borderRadius: '4px',
	textAlign: 'left',
	valign: 'bottom',
	...theme.applyStyles('dark', {
		backgroundColor: '#1A2027',
		borderColor: '#444d58',
	}),
}));

const StackItem = styled('div')(({ theme }) => ({
	backgroundColor: '#fff',
	textAlign: 'left',
	borderRadius: 4,
	...theme.applyStyles('dark', {
		backgroundColor: '#262B32',
	}),
}));

function Herb(herb, changeHerb, changeQuantity, availableHerbs, selectedHerbs, removeHerb,
		orderSuccess) {
	return (
			<StackItem key={herb.key}>
				<Grid container>
					<Grid size={{ xs: 12, sm: 8 }}>
						<Item>
							<Autocomplete
									disablePortal
									options={availableHerbs?.filter(h => selectedHerbs.findIndex(sh => sh.herbId === h.id) < 0).map(h => h.name)}
									renderInput={(params) => <TextField {...params}
																											label="Kräuter"/>}
									value={herb.herbId === -1 ? "" : availableHerbs.find(h => h.id === herb.herbId).name}
									onChange={(event, newValue) => changeHerb(herb.key, newValue)}
									disabled={orderSuccess}
							/>
						</Item>
					</Grid>
					<Grid size={{ xs: 10, sm: 3 }}>
						<Item>
							<TextField
									label="Anzahl"
									variant="outlined"
									type="number"
									sx={{ width: 1}}
									name={herb.key.toString()}
									disabled={orderSuccess}
									value={herb.quantity}
									onChange={changeQuantity} />
						</Item>
					</Grid>
					<Grid size={{ xs: 2, sm: 1 }}>
						<Item sx={{ display: "flex", alignItems: "center" }}>
							<IconButton aria-label="delete" disabled={orderSuccess} onClick={() => removeHerb(herb.key)}>
								<DeleteIcon />
							</IconButton>
						</Item>
					</Grid>
				</Grid>
			</StackItem>
	);
}

export default function HerbForm() {

	const {orderId} = useParams();
	const [cookies, setCookies] = useCookies(['herbauth']);

	const [order, setOrder] = useState(orderId === undefined ? {
		firstName: "",
		lastName: "",
		mail: "",
		herbs: [
				{key: 0, herbId: -1, quantity: ''},
				{key: 1, herbId: -1, quantity: ''},
				{key: 2, herbId: -1, quantity: ''},
				{key: 3, herbId: -1, quantity: ''},
				{key: 4, herbId: -1, quantity: ''}
		]} : null);

	const [isLoading, setIsLoading] = useState(true);

	const [saveInProcess, setSaveInProcess] = useState(false);

	const [availableHerbs, setAvailableHerbs] = useState([]);

	const [message, setMessage] = useState(null);

	useEffect(() => initializeHerbOrder(), []);

	function initializeHerbOrder() {
		if (cookies.herbauth === undefined) {
			return;
		}
		fetchAvailableHerbs()
		.then(() => {
			if (orderId !== undefined) {
				fetchOrder();
			}
		});
	}

	function fetchOrder() {
		const requestOptions = {
			method: 'GET',
			headers: {Accept: 'application/json,application/problem+json'}
		}
		return fetch(process.env.REACT_APP_BACKEND_URL + '/api/orders/' + orderId,
				requestOptions)
		.then(response => {
			if (response.status === 404) {
				throw Error("Order " + orderId + " was not found");
			} else if (response.status !== 200) {
				throw Error(response.json().detail);
			} else {
				return response.json();
			}
		})
		.then(data => humps.camelizeKeys(data))
		.then(data => addHerbKeys(data))
		.then(data => setOrder(data))
		.then(() => setIsLoading(false))
		.catch(error => {
			console.log("Error: " + error);
			setIsLoading(false);
		});
	}

	function addHerbKeys(order) {
		order.herbs.map((herb, index) => herb.key = index);
		return order;
	}

	function fetchAvailableHerbs() {
		const requestOptions = {
			method: 'GET'
		};
		return fetch(process.env.REACT_APP_BACKEND_URL + '/api/herbs', requestOptions)
			.then(response => response.json())
			.then(data => humps.camelizeKeys(data))
			.then(data => setAvailableHerbs(data));
	}

	function addHerb() {
		order.herbs = [...order.herbs, {
			key: Date.now(),
			herbId: -1,
			quantity: ''}];
		setOrder({...order});
	}

	function isEmpty(s) {
		return s === null || (typeof(s) === "string" && s.trim().length === 0);
	}

	function cleanupOrderForBackend() {
		const orderForBackend = {...order}
		orderForBackend.herbs = orderForBackend.herbs
		.filter(herb => herb.herbId > 0 || herb.quantity > 0)
		.map(herb => {
			const {key, ...newHerb} = herb;
			return newHerb;
		});
		return orderForBackend;
	}

	function saveHerb() {
		const orderForBackend = cleanupOrderForBackend();
		if (isEmpty(order.firstName)) {
			setMessage('Bitte gib den Vornamen ein!');
			return;
		}
		if (isEmpty(order.lastName)) {
			setMessage('Bitte gib den Nachnamen ein!');
			return;
		}
		if (isEmpty(order.mail)) {
			setMessage('Bitte gib die E-Mail-Adresse ein!');
			return;
		}
		if (orderForBackend.herbs.length === 0) {
			setMessage('Bitte füge Kräuter hinzu!');
			return;
		}
		const invalidHerbEntries = orderForBackend.herbs
			.filter(herb => herb.herbId < 0 || herb.quantity == null || isEmpty(herb.quantity) || herb.quantity <= 0);
		if (invalidHerbEntries.length > 0) {
			setMessage('Bitte kontrolliere die Kräuter. In einzelnen Zeilen fehlen Kräuternamen oder die Anzahl!');
			return;
		}
		const itemsGroupedByHerbs = Object.groupBy(
				orderForBackend.herbs,
				herb => herb.herbId
		);
		const numberDuplicateEntries = Object.keys(itemsGroupedByHerbs)
			.filter(key => itemsGroupedByHerbs[key].length > 1)
			.length;
		if (numberDuplicateEntries > 0) {
			setMessage('Bitte entferne die doppelten Kräuter!');
			return;
		}

		setSaveInProcess(true);
		setMessage(<LinearProgress />);
		if (orderId === undefined) {
			saveNewOrder(orderForBackend);
		} else {
			updateExistingOrder(orderForBackend)
		}
	}

	function saveNewOrder(orderForBackend) {
		const requestOptions = {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify(humps.decamelizeKeys(orderForBackend))
		};
		fetch(process.env.REACT_APP_BACKEND_URL + '/api/orders', requestOptions)
		.then(response => {
			if (response.status === 201) {
				return response.json();
			} else {
				throw Error();
			}
		})
		.then(json => {
			setMessage(<div><p>Die Bestellung wurde gespeichert!</p></div>);
			setSaveInProcess(false);
		})
		.catch(error => {
					setMessage(<p>Beim Abschicken der Bestellung ist ein Fehler
						aufgetreten!</p>);
					setSaveInProcess(false);
				}
		);
	}

	function updateExistingOrder(orderForBackend) {
		const requestOptions = {
			method: 'PUT',
			headers: {'Content-Type': 'application/json', Accept: 'application/json,application/problem+json'},
			body: JSON.stringify(humps.decamelizeKeys(orderForBackend))
		};
		fetch(process.env.REACT_APP_BACKEND_URL + '/api/orders/' + orderId,
				requestOptions)
		.then(response => {
			if (response.status === 200) {
				return response.json();
			} else {
				throw Error();
			}
		})
		.then(json => {
			setSaveInProcess(false);
			setMessage(<div><p>Die Bestellung wurde aktualisiert!</p></div>);
		})
		.catch(error => {
			setMessage(<p>Beim Abschicken der Bestellung ist ein Fehler aufgetreten!</p>)
			setSaveInProcess(false);
		});
	}

	function onRemoveHerb(herbKey) {
		order.herbs = order.herbs.filter(
				(item) => item.key !== herbKey
		);
		setOrder({...order});
	}

	function onChangeHerb(herbKey, newValue) {
		const herb = availableHerbs
			.find(herb => herb.name === newValue);
		order.herbs
			.filter(h => h.key === herbKey)
			.forEach(h => h.herbId = herb.id);
		setOrder({...order});
	}
	
	function onChangeQuantity(event) {
		order.herbs
			.filter(herb => herb.key.toString() === event.target.name)
			.forEach(herb => herb.quantity = event.target.value);
		setOrder({...order})
	}

	function onChangeFirstName(event) {
		order['firstName'] = event.target.value;
		setOrder({...order});
	}

	function onChangeLastName(event) {
		order['lastName'] = event.target.value;
		setOrder({...order});
	}

	function onChangeMail(event) {
		order['mail'] = event.target.value;
		setOrder({...order});
	}

	if (cookies.herbauth === undefined) {
		return (
				<Navigate to="/admin" />
		)
	}

	if (order === null) {
		return (
				<Box sx={{
					width: {s: 1, sm: 600},
					marginTop: 9,
					marginLeft: 2,
				}}>{
						isLoading ?
								<LinearProgress/>
								: <Box>Die angegebene Kräuterbestellung wurde nicht gefunden!</Box>
					}
				</Box>
		);
	}

	return (
			<Box sx={{
				width: {s: 1, sm: 600},
				marginTop: 9,
				marginLeft: 2,
			}}>
				<form>
					<Box
							sx={{
								marginTop: 3,
								marginBottom: 3,
								padding: 2,
								border: "1px solid rgb(192,192,192)",
								borderRadius: 1,
								backgroundColor: "rgb(255,255,255)" }}
					>
						<Typography variant="h4" gutterBottom>Persönliche Informationen</Typography>
						<Stack spacing={2}>
							<StackItem>
								<TextField
										label="Vorname"
										variant="outlined"
										sx={{width: 1}}
										value={order.firstName}
										onChange={onChangeFirstName}
										disabled={saveInProcess} />
							</StackItem>
							<StackItem>
								<TextField
										label="Nachname"
										variant="outlined"
										sx={{width: 1}}
										value={order.lastName}
										onChange={onChangeLastName}
										disabled={saveInProcess} />
							</StackItem>
							<StackItem>
								<TextField
										label="E-Mail-Adresse"
										variant="outlined"
										sx={{width: 1}}
										value={order.mail}
										onChange={onChangeMail}
										disabled={saveInProcess} />
							</StackItem>
						</Stack>
					</Box>
					<Box
							sx={{
								marginTop: 3,
								marginBottom: 3,
								padding: 2,
								border: "1px solid rgb(192,192,192)",
								borderRadius: 1,
								backgroundColor: "rgb(255,255,255)" }}
					>
						<Typography variant="h4" gutterBottom>Kräuter</Typography>
						<Stack>
							{
								order.herbs.map((element, index) => Herb(element,
										onChangeHerb, onChangeQuantity, availableHerbs, order.herbs,
										onRemoveHerb, saveInProcess))
							}
							<StackItem sx={{ paddingTop: 1 }}>
								<Button variant="contained" onClick={addHerb}
												disabled={saveInProcess}
												startIcon={<AddIcon/>}>Hinzufügen</Button>
							</StackItem>
						</Stack>
					</Box>
					<Box sx={{marginTop: 3, marginBottom: 3}}>
						<Grid container>
							<Grid size={3}>
									<Button variant="contained" href="/admin/orders"
													disabled={saveInProcess}
													startIcon={<ArrowBackIcon/>}>Zurück</Button>
							</Grid>
							<Grid size={3}>
									<Button variant="contained" onClick={saveHerb}
													disabled={saveInProcess}>Speichern</Button>
							</Grid>
						</Grid>
					</Box>

					{message}
				</form>
			</Box>
	);
}
