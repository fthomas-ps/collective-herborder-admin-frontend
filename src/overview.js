import {useState} from 'react';
import {useEffect} from 'react';
import humps from 'humps';
import {useCookies} from "react-cookie";
import {styled} from '@mui/system';
import Box from '@mui/system/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import './styles.css';
import {Navigate} from "react-router-dom";
import Stack from "@mui/system/Stack";
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

const StackItem = styled('div')(({theme}) => ({
  backgroundColor: '#fff',
  textAlign: 'left',
  borderRadius: 4,
  ...theme.applyStyles('dark', {
    backgroundColor: '#262B32',
  }),
}));

export default function Overview() {

  const [cookies, setCookies] = useCookies(['herbauth']);
  const [orderBatch, setOrderBatch] = useState(null);
  const [stats, setStats] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [saveInProcess, setSaveInProcess] = useState(false);

  const [placeholder, setPlaceholder] = useState(null);

  useEffect(() => initializeOverview(), []);

  function initializeOverview() {
    if (cookies.herbauth === undefined) {
      return;
    }
    fetchOrderBatch()
    .then(orderBatch => fetchStats());
  }

  function fetchStats() {
    const requestOptions = {
      method: 'GET',
      headers: {
        Accept: 'application/json,application/problem+json',
        Authorization: 'Basic ' + cookies.herbauth
      }
    }
    return fetch(
        process.env.REACT_APP_BACKEND_URL + '/api/admin/order_batches/42/stats',
        requestOptions)
    .then(response => {
      if (response.status !== 200) {
        throw Error(response.json().detail);
      } else {
        return response.json();
      }
    })
    .then(data => humps.camelizeKeys(data))
    .then(data => calculateDifferences(data))
    .then(data => setStats(data))
    .then(() => setIsLoading(false))
    .catch(error => {
      console.log("Error: " + error);
      setIsLoading(false);
    });
  }

  function calculateDifferences(stats) {
    return stats.map(herbStat => {
      if (herbStat.quantityBill !== undefined && herbStat.quantityBill
          - herbStat.quantityOrders !== 0) {
        herbStat.billDifference = herbStat.quantityBill
            - herbStat.quantityOrders;
        if (herbStat.billDifference > 0) {
          herbStat.billDifference = "+" + herbStat.billDifference;
        }
      }
      if (herbStat.quantityShipments !== undefined && herbStat.quantityShipments - herbStat.quantityOrders !== 0) {
        herbStat.shipmentDifference = herbStat.quantityShipments - herbStat.quantityOrders;
        if (herbStat.shipmentDifference > 0) {
          herbStat.shipmentDifference = "+" + herbStat.shipmentDifference;
        }
      }
      return herbStat;
    })
  }

  function fetchOrderBatch() {
    const requestOptions = {
      method: 'GET',
      headers: {
        Accept: 'application/json,application/problem+json',
        Authorization: 'Basic ' + cookies.herbauth
      }
    }
    return fetch(
        process.env.REACT_APP_BACKEND_URL + '/api/admin/order_batches/42',
        requestOptions)
    .then(response => {
      if (response.status !== 200) {
        throw Error(response.json().detail);
      } else {
        return response.json();
      }
    })
    .then(data => humps.camelizeKeys(data))
    .then(data => {
      console.log("Order Batch data: ", data);
      return data;
    })
    .then(data => setOrderBatch(data))
    .then(() => setIsLoading(false))
    .catch(error => {
      console.log("Error: " + error);
      setIsLoading(false);
    });
  }

  function onChangeName(event) {
    orderBatch['name'] = event.target.value;
    setOrderBatch({...orderBatch});
  }

  function onChangeOrderState(event) {
    orderBatch['orderState'] = event.target.value;
    setOrderBatch({...orderBatch});
  }

  function saveOrderBatch() {
    if (isEmpty(orderBatch.name)) {
      setPlaceholder('Bitte gib den Namen für die Sammelbestellung ein!');
      return;
    }
    if (isEmpty(orderBatch.orderState)) {
      setPlaceholder('Bitte gib den Prozessstatus für die Sammelbestellung ein!');
      return;
    }

    setSaveInProcess(true);
    setPlaceholder(<LinearProgress />);
    updateExistingOrderBatch(orderBatch);
  }

  function isEmpty(s) {
    return s === null || (typeof(s) === "string" && s.trim().length === 0);
  }

  function updateExistingOrderBatch(orderBatchForBackend) {
    const requestOptions = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json,application/problem+json',
        Authorization: 'Basic ' + cookies.herbauth},
      body: JSON.stringify(humps.decamelizeKeys(orderBatchForBackend))
    };
    fetch(process.env.REACT_APP_BACKEND_URL + '/api/admin/order_batches/42',
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
      setPlaceholder(<div><p>Die Sammelbestellung wurde aktualisiert!</p></div>);
    })
    .catch(error => {
      setPlaceholder(<p>Beim Speichern der Sammelbestellung ist ein Fehler aufgetreten!</p>)
      setSaveInProcess(false);
    });
  }

  if (cookies.herbauth === undefined) {
    return (
        <Navigate to="/admin" />
    );
  }

  if (orderBatch === null || stats === null) {
    return (
        <Box sx={{
          width: {s: 1, sm: 600},
          marginTop: 9,
          marginLeft: 2,
        }}>
          isLoading ?
          <LinearProgress/>
          : <Box>Die angegebene Sammelbestellung wurde nicht gefunden!</Box>
        </Box>
    );
  }

  return (
      <Box sx={{
        width: {s: 1, sm: 600},
        marginTop: 9,
        marginLeft: 2,
      }}>
        <Box sx={{ marginBottom: 6 }}>
          <Typography variant="h4" gutterBottom>Allgemeine
            Informationen</Typography>
          <Stack spacing={2}>
            <StackItem>
              <TextField
                  label="Name der Sammelbestellung"
                  variant="outlined"
                  sx={{width: 1}}
                  value={orderBatch.name}
                  onChange={onChangeName}
                  disabled={saveInProcess}/>
            </StackItem>
            <StackItem>
              <FormControl fullWidth>
                <InputLabel id="process-state-label">Prozessstatus</InputLabel>
                <Select
                    variant="outlined"
                    labelId="process-state-label"
                    id="process-state"
                    value={orderBatch.orderState}
                    label="Prozesstatus"
                    onChange={onChangeOrderState}
                >
                  <MenuItem value="CREATED">Sammelbestellung erstellt</MenuItem>
                  <MenuItem value="ORDERS_OPEN">Bestellungsannahme</MenuItem>
                  <MenuItem value="ORDER_BATCH_SUBMITTED">Sammelbestellung
                    beendet</MenuItem>
                  <MenuItem value="SHIPMENT_DISTRIBUTION">Verteilung der
                    Lieferung</MenuItem>
                  <MenuItem value="CLOSED">Abgeschlossen</MenuItem>
                </Select>
              </FormControl>
            </StackItem>
            <StackItem>
              <Button variant="contained" onClick={saveOrderBatch}
                      disabled={saveInProcess}>Speichern</Button>
            </StackItem>
            <StackItem>
              {placeholder}
            </StackItem>
          </Stack>
        </Box>
        <Box sx={{ marginBottom: 6 }}>
          <Typography variant="h4" gutterBottom>Bestellte Kräuter</Typography>
          <TableContainer component={Paper}>
            <Table sc={{minWidth: 600}} aria-label="herb table">
              <TableHead>
                <TableRow>
                  <TableCell>
                    Kräuter
                  </TableCell>
                  <TableCell>
                    Bestellungen
                  </TableCell>
                  <TableCell>
                    Abgerechnet
                  </TableCell>
                  <TableCell>
                    Geliefert
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {
                  stats.map(herb =>
                      <TableRow key={herb.key}>
                        <TableCell>
                          {herb.herbName}
                        </TableCell>
                        <TableCell>
                          {herb.quantityOrders}
                        </TableCell>
                        <TableCell>
                          {herb.quantityBill} {
                            herb.billDifference !== undefined ? (<>({herb.billDifference})</>) : (<></>)
                          }
                        </TableCell>
                        <TableCell>
                          {herb.quantityShipments} {
                            herb.shipmentDifference !== undefined ? (<>({herb.shipmentDifference})</>) : (<></>)
                          }
                        </TableCell>
                      </TableRow>
                  )
                }
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
  );

}
