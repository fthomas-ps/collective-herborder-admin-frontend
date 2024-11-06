import {useState} from 'react';
import {useEffect} from 'react';
import {Navigate, useParams} from "react-router-dom";
import humps from 'humps';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/de';
import Button from '@mui/material/Button';
import Stack from '@mui/system/Stack';
import { styled } from '@mui/system';
import Box from '@mui/system/Box';
import Grid from '@mui/system/Grid';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Typography from '@mui/material/Typography';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import LinearProgress from '@mui/material/LinearProgress';
import './styles.css';
import {useCookies} from "react-cookie";

const Item = styled('div')(({ theme }) => ({
	width: '100%',
	height: '100%',
	backgroundColor: '#fff',
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

export default function BillForm() {

	const [cookies, setCookies] = useCookies(['herbauth']);

	const [bill, setBill] = useState(null);

	const [isLoading, setIsLoading] = useState(true);

	const [saveInProcess, setSaveInProcess] = useState(false);

	const [availableHerbs, setAvailableHerbs] = useState([]);

	const [message, setMessage] = useState(null);

	useEffect(() => initializeBill(), []);

	function initializeBill() {
		if (cookies.herbauth === undefined) {
			return;
		}
		fetchAvailableHerbs()
		.then(() => fetchBill());
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

	function fetchBill() {
		const requestOptions = {
			method: 'GET',
			headers: {
				Accept: 'application/json,application/problem+json',
				Authorization: 'Basic ' + cookies.herbauth
			}
		}
		return fetch(process.env.REACT_APP_BACKEND_URL + '/api/admin/bills/42',
				requestOptions)
		.then(response => {
			if (response.status === 404) {
				throw Error("Bill was not found");
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
		.then(data => convertHerbPricesToUI(data))
		.then(data => addHerbKeys(data))
		.then(data => addEmptyEntriesIfRequired(data))
		.then(data => setBill(data))
		.then(() => setIsLoading(false))
		.catch(error => {
			console.log("Error: " + error);
			setIsLoading(false);
		});
	}

	function convertHerbPricesToUI(bill) {
		bill.herbs.map((herb, index) => herb.unitPrice = (herb.unitPrice/100).toFixed(2));
		return bill;
	}

	function addHerbKeys(bill) {
		bill.herbs.map((herb, index) => herb.key = index);
		return bill;
	}

	function addEmptyEntriesIfRequired(bill) {
		if (bill.herbs === undefined || bill.herbs.length === 0) {
			bill.herbs = [
				{key: 0, herbId: -1, unitPrice: '', quantity: ''},
				{key: 1, herbId: -1, unitPrice: '', quantity: ''},
				{key: 2, herbId: -1, unitPrice: '', quantity: ''},
				{key: 3, herbId: -1, unitPrice: '', quantity: ''},
				{key: 4, herbId: -1, unitPrice: '', quantity: ''}
			];
		}
		return bill;
	}

	function addHerb() {
		bill.herbs = [...bill.herbs, {
			key: Date.now(),
			herbId: -1,
			unitPrice: '',
			quantity: ''}];
		setBill({...bill});
	}

	function isEmpty(s) {
		return s === null || (typeof(s) === "string" && s.trim().length === 0);
	}

	function cleanupBillForBackend(bill) {
		console.log("Bill: ", bill);
		const billForBackend = {...bill};
		billForBackend.date = billForBackend.date.format('YYYY-MM-DD');
		billForBackend.herbs = billForBackend.herbs
		.map(herb => {
			const {key, ...newHerb} = herb;
			newHerb.unitPrice = newHerb.unitPrice*100;
			return newHerb;
		});
		return billForBackend;
	}

	function saveHerb() {
		const decimalPattern = /^\d*\.?\d+$/;
		const invalidPrices = bill.herbs.filter(herb => {console.log("HerbPrice", herb.unitPrice,typeof(herb.unitPrice), decimalPattern.test(herb.unitPrice));return herb.unitPrice === null || !decimalPattern.test(herb.unitPrice);});
		console.log("Invalid prices", invalidPrices);
		if (invalidPrices.length > 0) {
			setMessage('Bitte kontrolliere die Preise! Mindestens ein Preis fehlt oder hat hat ein invalides Format.');
			return;
		}
		const billForBackend = cleanupBillForBackend(bill);
		if (isEmpty(bill.date)) {
			setMessage('Bitte gib das Rechnungsdatum ein!');
			return;
		}
		if (isEmpty(bill.vat)) {
			setMessage('Bitte gib die Mehrwertsteuer ein!');
			return;
		}
		if (billForBackend.herbs.length === 0) {
			setMessage('Bitte füge Rechnungsposten hinzu!');
			return;
		}
		const invalidHerbEntries = billForBackend.herbs
			.filter(herb => herb.herbId < 0 || herb.unitPrice === null || herb.quantity === null || isEmpty(herb.quantity) || herb.quantity <= 0);
		console.log("invalidHerbEntries", invalidHerbEntries);
		if (invalidHerbEntries.length > 0) {
			setMessage('Bitte kontrolliere die Kräuter. In einzelnen Zeilen fehlen Kräuternamen, Preise oder die Anzahl!');
			return;
		}
		const itemsGroupedByHerbs = Object.groupBy(
				billForBackend.herbs,
				herb => herb.herbId
		);

	console.log("Saving Bill", billForBackend);

		setSaveInProcess(true);
		setMessage(<LinearProgress />);
		updateExistingBill(billForBackend);
	}

	function updateExistingBill(billForBackend) {
		const requestOptions = {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json,application/problem+json',
				Authorization: 'Basic ' + cookies.herbauth},
			body: JSON.stringify(humps.decamelizeKeys(billForBackend))
		};
		fetch(process.env.REACT_APP_BACKEND_URL + '/api/admin/bills/42',
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
			setMessage(<div><p>Die Rechnung wurde aktualisiert!</p></div>);
		})
		.catch(error => {
			setMessage(<p>Beim Abschicken der Rechnung ist ein Fehler aufgetreten!</p>)
			setSaveInProcess(false);
		});
	}

	function onRemoveHerb(herbKey) {
		bill.herbs = bill.herbs.filter(
				(item) => item.key !== herbKey
		);
		setBill({...bill});
	}

	function onChangeHerb(herbKey, newValue) {
		const herb = availableHerbs
			.find(herb => herb.name === newValue);
		bill.herbs
			.filter(h => h.key === herbKey)
			.forEach(h => h.herbId = herb.id);
		setBill({...bill});
		console.log("Bill", bill);
	}
	
	function onChangeQuantity(event) {
		bill.herbs
			.filter(herb => herb.key.toString() === event.target.name)
			.forEach(herb => herb.quantity = event.target.value);
		setBill({...bill});
	}

	function onChangePrice(event) {
		console.log("Price changed", event.target.name, event.target.value);
		bill.herbs
			.filter(herb => herb.key.toString() === event.target.name )
			.forEach(herb => herb.unitPrice = event.target.value);
		setBill({...bill});
		console.log("Bill", bill);
	}

	function onChangeDate(newDate) {
		bill['date'] = newDate;
		setBill({...bill});
	}

	function onChangeVat(event) {
		bill['vat'] = event.target.value;
		setBill({...bill});
	}

	if (cookies.herbauth === undefined) {
		return (
				<Navigate to="/admin" />
		)
	}

	if (bill === null) {
		return (
				<Box sx={{
					width: {s: 1, sm: 600},
					marginTop: 9,
					marginLeft: 2,
				}}>{
						isLoading ?
								<LinearProgress/>
								: <Box>Die angegebene Rechnung wurde nicht gefunden!</Box>
					}
				</Box>
		);
	}

	console.log("Loaded Bill", bill);

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
											label="Rechnungsdatum"
											variant="outlined"
											sx={{width: 1}}
											value={bill.date}
											onChange={onChangeDate}
											disabled={saveInProcess} />
									</DemoContainer>
								</LocalizationProvider>
							</StackItem>
							<StackItem>
								<FormControl fullWidth>
									<InputLabel htmlFor="price-input">Mehrwertsteuer</InputLabel>
									<OutlinedInput
											id="price-input"
											endAdornment={<InputAdornment position="end">%</InputAdornment>}
											label="Mehrwertsteuer"
											sx={{width: 1}}
											value={bill.vat}
											onChange={onChangeVat}
											disabled={saveInProcess}
									/>
								</FormControl>
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
						<Typography variant="h4" gutterBottom>Rechnungsposten (ohne Mwst.)</Typography>
						<Stack>
							{
								bill.herbs.map((herb, index) => (
										<StackItem key={herb.key}>
											<Grid container>
												<Grid size={{ xs: 12, sm: 5 }}>
													<Item>
														<Autocomplete
																disablePortal
																options={availableHerbs?.filter(h => bill.herbs.findIndex(sh => sh.herbId === h.id) < 0).map(h => h.name)}
																renderInput={(params) => <TextField {...params}
																																		label="Kräuter"/>}
																value={herb.herbId === -1 ? "" : availableHerbs.find(h => h.id === herb.herbId).name}
																onChange={(event, newValue) => onChangeHerb(herb.key, newValue)}
																disabled={saveInProcess}
														/>
													</Item>
												</Grid>
												<Grid size={{ xs: 5, sm: 3 }}>
													<Item>
														<FormControl fullWidth>
															<InputLabel htmlFor="price-input">Einzelpreis</InputLabel>
															<OutlinedInput
																id="price-input"
																endAdornment={<InputAdornment position="end">€</InputAdornment>}
																label="Einzelpreis"
																sx={{ width: 1}}
																name={herb.key.toString()}
																disabled={saveInProcess}
																value={herb.unitPrice}
																onChange={onChangePrice}
																/>
														</FormControl>
													</Item>
												</Grid>
												<Grid size={{ xs: 5, sm: 3 }}>
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
