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
import Stack from "@mui/system/Stack";
import TextField from "@mui/material/TextField";
import Grid from "@mui/system/Grid";
import {styled} from "@mui/system";

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

export default function OrderBatchesOverview() {

  const [cookies, setCookies] = useCookies(['herbauth']);
  const [orderBatches, setOrderBatches] = useState([]);
  const [placeholder, setPlaceholder] = useState((<></>));

  const [isLoading, setIsLoading] = useState(true);
  const [saveInProcess, setSaveInProcess] = useState(false);

  const [newOrderBatch, setNewOrderBatch] = useState({name : ""});

  useEffect(() => initializeOrderBatches(), []);

  function initializeOrderBatches() {
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
    fetch(process.env.REACT_APP_BACKEND_URL + '/api/admin/order_batches',
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
    .then(data => data.sort(orderBatchesSorting))
    .then(data => setOrderBatches(data))
    .then(() => setIsLoading(false))
    .catch(error => {
      console.log("Error: " + error);
      setIsLoading(false);
    });
  }

  function orderBatchesSorting(o1, o2) {
    return ((o1.name < o2.name) ? -1 : (o1.name > o2.name) ? 1 : 0);
  }

  function addKeys(orderBatches) {
    return orderBatches.map((orderBatch, index) => {
      orderBatch.key = index;
      return orderBatch;
    });
  }

  function openOrderBatch(externalId) {
    setPlaceholder(<Navigate to={"../orders"/* + externalId*/} />);
  }

  function onChangeName(event) {
    newOrderBatch['name'] = event.target.value;
    setNewOrderBatch({...newOrderBatch});
  }

  function createOrderBatch() {
    if (isEmpty(newOrderBatch.name)) {
      setMessage('Bitte gib einen Namen ein!');
      return;
    }

    const orderBatchForBackend = cleanupOrderBatchForBackend();

    setSaveInProcess(true);
    setPlaceholder(<LinearProgress />);
    saveNewOrderBatch(orderBatchForBackend);
  }

  function isEmpty(s) {
    return s === null || (typeof(s) === "string" && s.trim().length === 0);
  }

  function cleanupOrderBatchForBackend() {
    const orderBatchForBackend = {...newOrderBatch};
    return orderBatchForBackend;
  }

  function saveNewOrderBatch(orderBatchForBackend) {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + cookies.herbauth
      },
      body: JSON.stringify(humps.decamelizeKeys(orderBatchForBackend))
    };
    fetch(process.env.REACT_APP_BACKEND_URL + '/api/admin/order_batches', requestOptions)
        .then(response => {
          if (response.status === 201) {
            return response.json();
          } else {
            throw Error();
          }
        })
        .then(json => {
          setPlaceholder(<div><p>Die Kräuterbestellung wurde angelegt.</p></div>);
          <Navigate to="./" />
        })
        .catch(error => {
              setPlaceholder(<p>Beim Erstellen der Kräuterbestellung ist ein Fehler aufgetreten!</p>);
              setSaveInProcess(fase);
            }
        );
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
          <Typography variant="h4" gutterBottom>Kräuterbestellungen</Typography>
          <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
            {
              orderBatches.map((orderBatch) => (
                  <ListItem key={orderBatch.key}>
                    <ListItemButton onClick={() => openOrderBatch(orderBatch.externalId)} disabled={saveInProcess} dense>
                      <ListItemText primary={orderBatch.name} sx={{ width: 200 }}/>
                    </ListItemButton>
                  </ListItem>
              ))
            }
          </List>
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
              <Typography variant="h4" gutterBottom>Neue Kräuterbestellung erstellen</Typography>
              <Stack spacing={2}>
                <StackItem>
                  <TextField
                      label="Name"
                      variant="outlined"
                      sx={{width: 1}}
                      value={newOrderBatch.name}
                      onChange={onChangeName}
                      disabled={saveInProcess} />
                </StackItem>
              </Stack>
            </Box>
            <Box sx={{marginTop: 3, marginBottom: 3}}>
              <Grid container>
                <Grid size={3}>
                  <Button variant="contained" onClick={createOrderBatch}
                          disabled={saveInProcess}>Erstellen</Button>
                </Grid>
              </Grid>
            </Box>

            {placeholder}
          </form>
        </Box>
  );
}
