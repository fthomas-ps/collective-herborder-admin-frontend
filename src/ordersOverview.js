import {useState} from 'react';
import {useEffect} from 'react';
import {Fragment} from 'react';
import {Navigate} from "react-router-dom";
import { useCookies } from 'react-cookie';
import humps from 'humps';
import Box from '@mui/system/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import LinearProgress from '@mui/material/LinearProgress';
import './styles.css';
import Button from "@mui/material/Button";
import MailIcon from '@mui/icons-material/Mail';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function OrdersOverview() {

  const [cookies, setCookies] = useCookies(['herbauth']);
  const [orders, setOrders] = useState([]);
  const [placeholder, setPlaceholder] = useState((<></>));

  const [isLoading, setIsLoading] = useState(true);
  const [saveInProcess, setSaveInProcess] = useState(false);
  const [priceMailDialogOpen, setPriceMailDialogOpen] = useState(false);

  useEffect(() => initializeHerbOrders(), []);

  function initializeHerbOrders() {
    if (cookies.herbauth === undefined) {
      return;
    }
    const requestOptions = {
      method: 'GET',
      headers: {
        Accept: 'application/json,application/problem+json',
        Authorization: 'Basic ' + cookies.herbauth
      }
    }
    fetch(process.env.REACT_APP_BACKEND_URL + '/api/admin/orders',
        requestOptions)
    .then(response => {
      if (response.status !== 200) {
        throw Error(response.json().detail);
      } else {
        return response.json();
      }
    })
    .then(data => humps.camelizeKeys(data))
    .then(data => addKeys(data))
    .then(data => data.sort(ordersSorting))
    .then(data => calculatePrices(data))
    .then(data => setOrders(data))
    .then(() => setIsLoading(false))
    .catch(error => {
      console.log("Error: " + error);
      setIsLoading(false);
    });
  }

  function ordersSorting(o1, o2) {
    const name1 = o1.firstName + " " + o1.lastName;
    const name2 = o2.firstName + " " + o2.lastName;
    return ((name1 < name2) ? -1 : (name1 > name2) ? 1 : 0);
  }

  function addKeys(orders) {
    return orders.map((order, index) => {
      order.key = index;
      return order;
    });
  }

  function calculatePrices(orders) {
    return orders.map((order) => {
      order.price = (order.price / 100).toFixed(2);
      return order;
    });
  }

  function openEditOrder(externalId) {
    setPlaceholder(<Navigate to={"./" + externalId} />);
  }

  function handlePriceMails() {
    setPriceMailDialogOpen(true);
  }

  function handlePriceMailDialogClose() {
    setPriceMailDialogOpen(false);
  }

  function sendPriceMails() {
    setSaveInProcess(true);
    setPriceMailDialogOpen(false);
    const requestOptions = {
      method: 'POST',
      headers: {
        Accept: 'application/json,application/problem+json',
        Authorization: 'Basic ' + cookies.herbauth
      }
    }
    fetch(process.env.REACT_APP_BACKEND_URL + '/api/admin/orders/price-mails',
        requestOptions)
    .then(response => {
      if (response.status !== 200) {
        throw Error(response.json().detail);
      }
    })
    .then(()=> setPlaceholder(<p>Die Preis-Mails wurden erfolgreich gesendet!</p>))
    .then(() => setSaveInProcess(false))
    .catch(error => {
      console.log("Error: " + error);
      setSaveInProcess(false);
      setPlaceholder(<p>Beim Senden der Preis-Mails ist ein Fehler aufgetreten!</p>)
    });
  }

  if (cookies.herbauth === undefined) {
    return (
        <Navigate to="/admin" />
    );
  }

  if (isLoading) {
    return (
        <Box sx={{
          width: {s: 1, sm: 600},
          marginTop: 9,
          marginLeft: 2,
        }}>
          <LinearProgress/>
        </Box>
    );
  }

  return (
        <Box sx={{
          width: {s: 1, sm: 600},
          marginTop: 9,
          marginLeft: 2,
        }}>
          <Typography variant="h4" gutterBottom>Einzelbestellungen</Typography>
          <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
            {
              orders.map((order) => (
                  <ListItem key={order.key}>
                    <ListItemButton onClick={() => openEditOrder(order.externalId)} disabled={saveInProcess} dense>
                      <ListItemText primary={order.firstName + " " + order.lastName} secondary={order.mail}
                        sx={{ width: 200 }}/>
                      <ListItemText primary={order.price + " €"} sx={{ width: 100, textAlign: 'right' }} />
                    </ListItemButton>
                  </ListItem>
              ))
            }
          </List>
          <Button variant="contained"
                  onClick={handlePriceMails}
                  startIcon={<MailIcon/>}
                  disabled={saveInProcess}>Preis-Mail schicken</Button>
          {placeholder}
          <Fragment>
            <Dialog
                open={priceMailDialogOpen}
                onClose={handlePriceMailDialogClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
              <DialogTitle id="alert-dialog-title">
                {"Preis-Mail senden?"}
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  Möchten Sie die Preis-Mail für alle Bestellungen senden?
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={handlePriceMailDialogClose}>Nein</Button>
                <Button onClick={sendPriceMails} autoFocus>Ja</Button>
              </DialogActions>
            </Dialog>
          </Fragment>
        </Box>
  );
}
