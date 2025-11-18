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
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {DemoContainer} from "@mui/x-date-pickers/internals/demo";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import dayjs from 'dayjs';
import 'dayjs/locale/de';

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

export default function ShipmentUpdate() {

	const {shipmentId} = useParams();
	const [cookies, setCookies] = useCookies(['herbauth']);
  const {orderBatchId} = useParams();

	const [shipment, setShipment] = useState(shipmentId === undefined ? {
		date: dayjs(new Date()),
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

	const [placeholder, setPlaceholder] = useState(null);

	useEffect(() => initializeShipment(), []);

	function initializeShipment() {
		if (cookies.herbauth === undefined) {
			return;
		}
		fetchAvailableHerbs()
		.then(() => {
			if (shipmentId !== undefined) {
				fetchShipment();
			}
		});
	}

	function fetchShipment() {
		const requestOptions = {
			method: 'GET',
			headers: {
				Accept: 'application/json,application/problem+json',
				Authorization: 'Basic ' + cookies.herbauth
			}
		}
		return fetch(process.env.REACT_APP_BACKEND_URL + '/api/admin/order_batches/' + orderBatchId + '/shipments/' + shipmentId,
				requestOptions)
		.then(response => {
			if (response.status === 404) {
				throw Error("Shipment " + shipmentId + " was not found");
			} else if (response.status !== 200) {
				throw Error(response.json().detail);
			} else {
				return response.json();
			}
		})
		.then(data => humps.camelizeKeys(data))
		.then(data => {
			data.date = dayjs(data.date);
			return data;
		})
		.then(data => addHerbKeys(data))
		.then(data => setShipment(data))
		.then(() => setIsLoading(false))
		.catch(error => {
			console.log("Error: " + error);
			setIsLoading(false);
		});
	}

	function addHerbKeys(shipment) {
		shipment.herbs.map((herb, index) => herb.key = index);
		return shipment;
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
		shipment.herbs = [...shipment.herbs, {
			key: Date.now(),
			herbId: -1,
			quantity: ''}];
		setShipment({...shipment});
	}

	function isEmpty(s) {
		return s === null || (typeof(s) === "string" && s.trim().length === 0);
	}

	function cleanupShipmentForBackend() {
		const shipmentForBackend = {...shipment}
		shipmentForBackend.date = shipmentForBackend.date.format("YYYY-MM-DD");
		shipmentForBackend.herbs = shipmentForBackend.herbs
		.filter(herb => herb.herbId > 0 || herb.quantity > 0)
		.map(herb => {
			const {key, ...newHerb} = herb;
			return newHerb;
		});
		return shipmentForBackend;
	}

	function saveShipment() {
		const shipmentForBackend = cleanupShipmentForBackend();
		if (isEmpty(shipment.date)) {
			setPlaceholder('Bitte gib das Datum der Lieferung ein!');
			return;
		}
		if (shipmentForBackend.herbs.length === 0) {
			setPlaceholder('Bitte füge Kräuter hinzu!');
			return;
		}
		const invalidHerbEntries = shipmentForBackend.herbs
			.filter(herb => herb.herbId < 0 || herb.quantity == null || isEmpty(herb.quantity) || herb.quantity <= 0);
		if (invalidHerbEntries.length > 0) {
			setPlaceholder('Bitte kontrolliere die Kräuter. In einzelnen Zeilen fehlen Kräuternamen oder die Anzahl!');
			return;
		}

		setSaveInProcess(true);
		setPlaceholder(<LinearProgress />);
		if (shipmentId === undefined) {
			saveNewShipment(shipmentForBackend);
		} else {
			updateExistingShipment(shipmentForBackend);
		}
	}

	function saveNewShipment(shipmentForBackend) {
		const requestOptions = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Basic ' + cookies.herbauth
			},
			body: JSON.stringify(humps.decamelizeKeys(shipmentForBackend))
		};
		fetch(process.env.REACT_APP_BACKEND_URL + '/api/admin/order_batches/' + orderBatchId + '/shipments', requestOptions)
		.then(response => {
			if (response.status === 201) {
				return response.json();
			} else {
				throw Error();
			}
		})
		.then(json => {
			setPlaceholder(<div><p>Die Lieferungsinformationen wurden gespeichert!</p></div>);
		})
		.catch(error => {
					setPlaceholder(<p>Beim Abschicken der Lieferungsinformationen ist ein Fehler
						aufgetreten!</p>);
					setSaveInProcess(false);
				}
		);
	}

	function updateExistingShipment(shipmentForBackend) {
		const requestOptions = {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json,application/problem+json',
				Authorization: 'Basic ' + cookies.herbauth},
			body: JSON.stringify(humps.decamelizeKeys(shipmentForBackend))
		};
		fetch(process.env.REACT_APP_BACKEND_URL + '/api/admin/order_batches/' + orderBatchId + '/shipments/' + shipmentId,
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
			setPlaceholder(<div><p>Die Lieferungsinformationen wurden aktualisiert!</p></div>);
		})
		.catch(error => {
			setPlaceholder(<p>Beim Abschicken der Lieferungsinformationen ist ein Fehler aufgetreten!</p>)
			setSaveInProcess(false);
		});
	}

	function onRemoveHerb(herbKey) {
		shipment.herbs = shipment.herbs.filter(
				(item) => item.key !== herbKey
		);
		setShipment({...shipment});
	}

	function onChangeHerb(herbKey, newValue) {
		const herb = availableHerbs
			.find(herb => herb.name === newValue);
		shipment.herbs
			.filter(h => h.key === herbKey)
			.forEach(h => h.herbId = herb === undefined ? -1 : herb.id);
		setShipment({...shipment});
	}
	
	function onChangeQuantity(event) {
		shipment.herbs
			.filter(herb => herb.key.toString() === event.target.name)
			.forEach(herb => herb.quantity = event.target.value);
		setShipment({...shipment});
	}

	function onChangeDate(newDate) {
		shipment['date'] = newDate;
		setShipment({...shipment});
	}

	if (cookies.herbauth === undefined) {
		return (
				<Navigate to="/admin" />
		)
	}

	if (shipment === null) {
		return (
				<Box sx={{
					width: {s: 1, sm: 600},
					marginTop: 9,
					marginLeft: 2,
				}}>{
						isLoading ?
								<LinearProgress/>
								: <Box>Die angegebene Lieferung wurde nicht gefunden!</Box>
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
						<Typography variant="h4" gutterBottom>Allgemeine Informationen</Typography>
						<Stack spacing={2}>
							<StackItem>
								<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
									<DemoContainer components={['DatePicker']}>
										<DatePicker
												label="Lieferdatum"
												variant="outlined"
												sx={{width: 1}}
												value={shipment.date}
												onChange={onChangeDate}
												disabled={saveInProcess} />
									</DemoContainer>
								</LocalizationProvider>
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
								shipment.herbs.map((herb, index) => (
										<StackItem key={herb.key}>
											<Grid container>
												<Grid size={{ xs: 12, sm: 8 }}>
													<Item>
														<Autocomplete
																disablePortal
																options={availableHerbs?.filter(h => shipment.herbs.findIndex(sh => sh.herbId === h.id) < 0).map(h => h.name)}
																renderInput={(params) => <TextField {...params}
																																		label="Kräuter"/>}
																value={herb.herbId === -1 ? "" : availableHerbs.find(h => h.id === herb.herbId).name}
																onChange={(event, newValue) => onChangeHerb(herb.key, newValue)}
																disabled={saveInProcess}
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
																disabled={saveInProcess}
																value={herb.quantity}
																onChange={onChangeQuantity} />
													</Item>
												</Grid>
												<Grid size={{ xs: 2, sm: 1 }}>
													<Item sx={{ display: "flex", alignItems: "center" }}>
														<IconButton aria-label="delete" disabled={saveInProcess} onClick={() => onRemoveHerb(herb.key)}>
															<DeleteIcon />
														</IconButton>
													</Item>
												</Grid>
											</Grid>
										</StackItem>
								))
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
									<Button variant="contained" href={"/admin/order_batches/" + orderBatchId + "/shipments"}
													startIcon={<ArrowBackIcon/>}>Zurück</Button>
							</Grid>
							<Grid size={3}>
									<Button variant="contained" onClick={saveShipment}
													disabled={saveInProcess}>Speichern</Button>
							</Grid>
						</Grid>
					</Box>

					{placeholder}
				</form>
			</Box>
	);
}
