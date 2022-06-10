import axios from 'axios';
import { useEffect, useState } from 'react';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import ButtonBootstrap from 'react-bootstrap/Button'
import { getMaintenanceUsers } from '../api/users';
import { dateToString } from '../utils/dateParsers';
import moment from 'moment';
import Card from 'react-bootstrap/Card'
import Badge from 'react-bootstrap/Badge'
import {datesAscending} from '../utils/sorting'

const divContainerStyle = {
  height: 800,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  paddingLeft: 20,
  paddingRight: 50,
};

const mapModalStyle = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center'
}

function Home() {
  const [cars, setCars] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [carsWithReservationFirst, setCarsWithReservationFirst] = useState([]);
  const [selectedCarReservations, setSelectedCarReservations] = useState([])
  const [reservationsModalShow, setReservationsModalShow] = useState(false)
  const [mapViewModalShow, setMapViewModalShow] = useState(false)
  const [carForMapView, setCarForMapView] = useState({ position: { latitude: 0, longitude: 0 } })
  const [sourceForMap, setSourceForMap] = useState('')
  const [createReserveModalShow, setCreateReserveModalShow] = useState(false)
  const [maintenanceUsers, setMaintenanceUsers] = useState([])
  const [reservationSelectedDay, setDiaReserva] = useState(moment().format('YYYY-MM-DD'))
  const [reservationSelectedTime, setHoraReserva] = useState(moment().startOf('hour').format('hh:mm'))
  const [reservationSelectedEmployee, setMailDeOperario] = useState("")
  const [carForReservation, setCarForReservation] = useState({})

  const handleCloseReservationModal = () => setReservationsModalShow(false);
  const handleCloseMapViewModal = () => setMapViewModalShow(false);
  const handleCloseCreateReserveModal = () => setCreateReserveModalShow(false);

  async function createReservation(car, employeeMail, reservationDay, reservationTime) {
    const reservation = { car, employeeMail, reservationDay, reservationTime }
    await axios.post(`${process.env.REACT_APP_BASE_URL}/reservations/`, reservation)

  }

  useEffect(() => {
    async function fetchData() {

      const carsResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/cars/`);
      setCars(carsResponse.data);

      const reservantionResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/reservations/`);
      setReservations(reservantionResponse.data)

      const fetchMaintenanceUsers = await getMaintenanceUsers();
      const valuesMaintananceUser = fetchMaintenanceUsers.map((m) => { return { value: m.email, label: m.name } })
      setMaintenanceUsers(valuesMaintananceUser)


    }
    fetchData();
  }, [])

  useEffect(() => {

    setSourceForMap('<iframe width = "800" height = "650" style = "border:0" loading = "lazy" allowfullscreen referrerpolicy = "no-referrer-when-downgrade" src = "https://maps.google.com/maps?q=' + carForMapView.position.latitude + ',' + carForMapView.position.longitude + '&hl=es&z=14&amp;output=embed"></iframe >')
  }, [mapViewModalShow])

  useEffect(() => {
    //separo los autos con reserva
    let filteredCars = cars.filter((c) => {
      return reservations.some((r) => {
        return r.car.plate == c.plate;
      });
    });

    //separo el resto de los autos sacando los que tenian reserva
    let restOfcars = cars.filter((c) => {
      return !filteredCars.includes(c)
    })

    //junto los dos array quedando los que tienen reserva al principio y agregando los otros detrás
    //TODO: ordenar previamente los reservados por fecha más próxima
    filteredCars.push(...restOfcars)

    //lo mapeo para la tabla
    const carsForTable = filteredCars.map((car) => {
      return {
        id: car._id,
        plate: car.plate,
        description: car.description,
        fuelLevel: car.fuelLevel,
        fuelType: car.fuelType,
        parkingName: car.parkingName,
        idParkingSlot: car.idParkingSlot,
        lastModifiedDate: car.lastModifiedDate,
        position: car.position ? { latitude: car.position.latitude, longitude: car.position.longitude } : { latitude: 0, longitude: 0 },
        battery: car.battery,
        fruta: 'a'

      }
    })
    setCarsWithReservationFirst(carsForTable);
  }, [cars])

  const columns = [
    {
      headerName: 'Reservas',
      renderCell: (params) => {
        const dayReservations = reservations.filter(r => r.car.plate == params.row.plate).filter(r => (moment().isSame(moment(r.startTime), 'day')))
        return (
          <ButtonBootstrap variant="outline-secondary" onClick={() => {
            setSelectedCarReservations(reservations.filter(r => r.car.plate === params.row.plate)
                                                  .sort(datesAscending))
            setReservationsModalShow(true)
          }}>
            Ver <Badge bg="dark">{dayReservations.length}</Badge>
            <span className="visually-hidden"></span>
          </ButtonBootstrap>
        )
      }
    },
    {
      headerName: 'Proxima',
      field: 'fruta',
      renderCell: (params) => {
        const nextReservation = reservations.filter(r => r.car.plate == params.row.plate)
          .filter(r => moment().isSame(moment(r.startTime), 'day'))
          .filter(r => moment(r.startTime).isAfter(moment(), 'hour'))
          .sort(datesAscending)
        console.log(nextReservation[0])

        return (
          <p>{nextReservation.length > 0 ? moment(nextReservation[0].startTime).format('hh:mm A') : '-'}</p>
        )
      }
    },
    {
      headerName: 'Asignar',
      field: 'Asignar',
      type: 'actions',
      getActions: (params) => [
        <GridActionsCellItem icon={<AssignmentIndIcon fontSize='large' />}
          onClick={() => {
            setCarForReservation(cars.find(car => car.plate === params.row.plate))
            setCreateReserveModalShow(true)
          }
          }
        />
      ]
    },
    {
      headerName: 'Ver en mapa',
      field: 'map',
      type: 'actions',
      getActions: (params) => [
        <GridActionsCellItem icon={<LocationOnIcon fontSize='large' />}
          onClick={async () => {
            setCarForMapView(params.row)
            setMapViewModalShow(true)
          }
          }
          label="Delete" />
      ]
    },
    { field: 'id', headerName: 'ID', width: 70, hide: true },
    {
      field: 'plate', headerName: 'Patente', width: 120,
      sortable: false,
      valueGetter: (params) => `${params.row.plate}`,
    },
    {
      field: 'fuelLevel',
      headerName: 'Combustible',
      width: 130,
      align: 'center',
      cellClassName: (params) => {
        if (params.row.fuelLevel < 25) return 'red';
        if (params.row.fuelLevel < 50 && params.row.fuelLevel >= 25) return 'orange';
        if (params.row.fuelLevel < 75 && params.row.fuelLevel >= 50) return 'yellow';
        if (params.row.fuelLevel <= 100 && params.row.fuelLevel >= 75) return 'green';
      }
    },
    {
      field: 'battery',
      headerName: 'Batería',
      width: 130,
      align: 'center',
      cellClassName: (params) => {
        if (params.row.battery < 11) return 'red';
        if (params.row.battery < 12 && params.row.battery >= 11) return 'orange';
      }
    },
    { field: 'description', headerName: 'Modelo', width: 130 },
    { field: 'fuelType', headerName: 'Tipo de combustible', width: 130 },
    { field: 'parkingName', headerName: 'Estacionamiento', width: 300 },
    { field: 'idParkingSlot', headerName: 'Ubicacion', width: 130 },
  ]



  return (
    <div style={divContainerStyle}>
      <Box
        sx={{
          height: 3000,
          width: 2000,
          '& .green': {
            backgroundColor: '#66ff99',
            color: '#1a3e72',
            fontWeight: '600',
          },
          '& .red': {
            backgroundColor: '#ff4d4d',
            color: '#1a3e72',
            fontWeight: '600',
          },
          '& .orange': {
            backgroundColor: '#ffc266',
            color: '#1a3e72',
            fontWeight: '600',
          },
          '& .yellow': {
            backgroundColor: '#ffff80',
            color: '#1a3e72',
            fontWeight: '600',
          },
        }}
      >
        <DataGrid
          rows={carsWithReservationFirst}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5]}
        />
      </Box>
      <Modal show={reservationsModalShow} onHide={handleCloseReservationModal} size="sm">
        <Modal.Header closeButton>
          <Modal.Title>Reservas del dia</Modal.Title>
        </Modal.Header>
        <Modal.Body>{selectedCarReservations.map(e => {
          if (moment().isSame(moment(e.startTime), 'day')) {
            return (
              <Card border="primary" style={{ marginBottom: 10 }}>
                <Card.Header style={{ alignItems: 'center' }}>
                  <b>{moment(e.startTime).format('hh:mm A')} - {moment(e.endTime).format('hh:mm A')}</b>
                </Card.Header>
                <Card.Body>
                  <Card.Text>{e.user.email}</Card.Text>
                </Card.Body>
              </Card>
            )
          }
        })}
        </Modal.Body>
      </Modal>

      <Modal show={mapViewModalShow} onHide={handleCloseMapViewModal} size={'xl'}  >
        <Modal.Header closeButton>
          <Modal.Title>Vista de mapa</Modal.Title>
        </Modal.Header>
        <Modal.Body style={mapModalStyle}>
          <div dangerouslySetInnerHTML={{ __html: sourceForMap }}></div>
        </Modal.Body>

      </Modal>
      <Modal show={createReserveModalShow} onHide={handleCloseCreateReserveModal}>
        <Modal.Header >
          <Modal.Title>Asignar reserva a operario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>Elegir dia</Form.Label>
              <Form.Control
                type="date"
                min={dateToString(new Date())}
                defaultValue={reservationSelectedDay}
                onChange={e => { setDiaReserva(e.target.value) }}
                autoFocus
              />
              <Form.Label>Elegir horario</Form.Label>
              <Form.Control
                type="time"
                defaultValue={reservationSelectedTime}
                onChange={e => { setHoraReserva(e.target.value) }}
                autoFocus
              />
              <Form.Label>Elegir operario</Form.Label>
              <Form.Select
                aria-label="Default select example"
                onChange={e => { setMailDeOperario(e.target.value) }}
              >
                {maintenanceUsers.map((m) => (
                  <option value={m.value}>{m.label}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <ButtonBootstrap variant="secondary" onClick={() => {
            setCreateReserveModalShow(false)
            setMailDeOperario("")
          }
          }>Cerrar
          </ButtonBootstrap>
          <ButtonBootstrap variant="primary" onClick={() => {
            createReservation(carForReservation, reservationSelectedEmployee, reservationSelectedDay, reservationSelectedTime)
            setCreateReserveModalShow(false)
          }
          }>Asignar reserva
          </ButtonBootstrap>
        </Modal.Footer>
      </Modal>
    </div>
  );
}


export default Home;