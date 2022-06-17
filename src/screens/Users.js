import moment from 'moment';
import React, { useEffect, useState, forwardRef } from 'react';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Snackbar } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AddIcon from '@mui/icons-material/Add';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import ButtonBootstrap from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Badge from 'react-bootstrap/Badge'
import { datesAscending } from '../utils/sorting'
import { getMaintenanceUsers, createNewUser, updateOneUser, deleteOneUser } from '../api/users';
import { getAllReservations } from '../api/reservations';
import DeleteUserModal from './Users/components/modals/DeleteUserModal';
import AssignmentsModal from './Users/components/modals/AssignmentsModal';



const divContainerStyle = {
  height: 800,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  paddingLeft: 20,
  paddingRight: 50,
};

function Users() {
  const [editModalShow, setEditModalShow] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newUserModalShow, setNewUserModalShow] = useState(false);
  const [users, setUsers] = useState([]);
  const [reserves, setReserves] = useState([]);
  const [userForEditOrDeletion, setUserForEditOrDeletion] = useState('');
  const [updateFlag, setUpdateFlag] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', password: '' });
  const [showAssigmentsModal, setShowAssigmentsModal] = useState(false);
  const [reservesByUser, setReservesByUser] = useState([]);
  const [openSnackError, setOpenSnackError] = useState(false);
  const [openSnackSuccess, setOpenSnackSuccess] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [isPinShowing, setIsPinShowing] = useState(false);

  const handleClick = () => {
    setOpenSnackError(false);
    setOpenSnackSuccess(false)
  };
  const [process, setProcess] = useState(true);

  const Alert = forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });

  const onOpenDeleteUserModal = (user) => {
    setUserForEditOrDeletion(user);
    setShowDeleteModal(true);
  }

  const onHideDeleteUserModal = () => {
    setShowDeleteModal(false);
    setUserForEditOrDeletion('');
  }

  const onOpenAssignmentsModal = (reserves) => {
    setReservesByUser(reserves);
    setShowAssigmentsModal(true);
  }

  const onHideAssignmentsModal = () => {
    setShowAssigmentsModal(false);
  }


  async function createUser(user) {
    try {
      await createNewUser(user);
      setNewUserModalShow(false);
      setSnackMessage('Usuario creado correctamente.');
      setOpenSnackSuccess(true);
      setUpdateFlag(!updateFlag)
    } catch (error) {
      console.log(error)
      setSnackMessage(error.message);
      setOpenSnackError(true);
    }
  }

  async function updateUser(userId) {
    try {
      await updateOneUser(userId, userForEditOrDeletion);
      setEditModalShow(false)
      setSnackMessage('Usuario modificado correctamente.');
      setOpenSnackSuccess(true);
      setUpdateFlag(!updateFlag)
    } catch (error) {
      setSnackMessage(error.message);
      setOpenSnackError(true);
    }
  }

  async function deleteUser(userId) {
    try {
      await deleteOneUser(userId);
      setShowDeleteModal(false)
      setSnackMessage('Usuario borrado correctamente.');
      setOpenSnackSuccess(true);
      setUpdateFlag(!updateFlag)
    } catch (error) {
      setSnackMessage(error.message);
      setOpenSnackError(true);
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setProcess(true);
        const usersResponse = await getMaintenanceUsers();
        const reserves = await getAllReservations();
        const usersForTable = usersResponse.map((user) => {
          return {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            pin: user.pin,
            admin: user.admin
          }
        })
        setUsers(usersForTable);
        setReserves(reserves)
        setProcess(false);
      } catch (error) {
        setSnackMessage(error.message);
        setOpenSnackError(true);
      }
    }
    fetchData();
  }, [updateFlag])

  const columns = [
    { field: 'id', headerName: 'ID', width: 70, hide: true },
    { field: 'name', headerName: 'Nombre', width: 150 },
    {
      headerName: 'Asignaciones',
      field: 'Asignaciones',
      type: 'actions',
      width: '120',
      renderCell: (params) => {
        const dayAsignations = reserves.filter(r => r.user.email === params.row.email).filter(r => (moment().isSame(moment(r.startTime), 'day')))
        return (
          <ButtonBootstrap variant="outline-secondary" onClick={() => {
            const filteredRserves = reserves.filter((r) =>
              r.user.email === params.row.email &&
              r.bookingType === 'MAINTENANCE' &&
              moment(r.startTime).isSame(moment(), 'day')
            ).sort(datesAscending);
            onOpenAssignmentsModal(filteredRserves);
          }}>
            Ver <Badge bg="dark">{dayAsignations.length}</Badge>
            <span className="visually-hidden"></span>
          </ButtonBootstrap>
        )
      }
    },
    { field: 'phone', headerName: 'Telefono', width: 150 },
    {
      field: 'pin', headerName: 'PIN', width: 100,
      renderCell: (params) => {
        if (isPinShowing) {
          return (
            <div style={{
              display: 'flex',
              flexDirection: 'row'
            }}>
              <p onClick={() => { setIsPinShowing(false) }} style={{ paddingRight: 10 }}>{params.row.pin}</p>
              <VisibilityOffIcon color="disabled" onClick={() => { setIsPinShowing(false) }}></VisibilityOffIcon>
            </div>)
        }
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'row'
          }}>
            <p style={{ paddingRight: 20 }}>••••</p>
            <VisibilityIcon color="disabled" onClick={() => { setIsPinShowing(true) }} />
          </div>

        )

      }
    },
    {
      field: 'email', headerName: 'Email',
      sortable: false,
      width: 250,
      valueGetter: (params) =>
        `${params.row.email}`,
    },
    {
      field: 'admin', headerName: 'Administrador', width: 100, align: 'center',
      renderCell: (params) => {
        if (params.row.admin === true) {
          return (
            <CheckCircleIcon color="primary" />
          )
        } else {
          return (
            <p>-</p>
          )
        }
      }
    },
    {
      headerName: 'Gestion',
      field: 'actions',
      type: 'actions',
      width: '90',

      getActions: (params) => [
        <GridActionsCellItem icon={<DeleteIcon />}
          onClick={() => { onOpenDeleteUserModal(params.row); }}
          label="Delete" />,
        <GridActionsCellItem icon={<EditIcon />}
          onClick={() => {
            setUserForEditOrDeletion(params.row)
            setEditModalShow(true)
          }
          }
          label="Print" />,
      ]
    },
  ];

  return (
    <div style={divContainerStyle}>
      <ButtonBootstrap variant="primary"
        style={{ alignSelf: 'end', marginBottom: 10, backgroundColor: '#1976d2' }}
        onClick={() => setNewUserModalShow(true)}
      ><AddIcon /> Nuevo Usuario
      </ButtonBootstrap>
      <DataGrid
        rows={users}
        columns={columns}
        pageSize={20}
        rowsPerPageOptions={[20]}
        components={{
          LoadingOverlay: LinearProgress,
        }}
        loading={process}
        {...users}
      />
      <div>
        <Modal show={editModalShow}>
          <Modal.Header >
            <Modal.Title>Editar datos</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                <Form.Label>Nombre y apellido</Form.Label>
                <Form.Control
                  type="text"
                  defaultValue={userForEditOrDeletion.name}
                  onChange={e => setUserForEditOrDeletion({ ...userForEditOrDeletion, name: e.target.value })}
                  autoFocus
                />
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  defaultValue={userForEditOrDeletion.email}
                  onChange={e => setUserForEditOrDeletion({ ...userForEditOrDeletion, email: e.target.value })}
                  autoFocus
                />
                <Form.Label>Telefono</Form.Label>
                <Form.Control
                  type="phone"
                  defaultValue={userForEditOrDeletion.phone}
                  onChange={e => setUserForEditOrDeletion({ ...userForEditOrDeletion, phone: e.target.value })}
                  autoFocus
                />
                <Form.Label>Pin</Form.Label>
                <Form.Control
                  type="number"
                  defaultValue={userForEditOrDeletion.pin}
                  onChange={e => setUserForEditOrDeletion({ ...userForEditOrDeletion, pin: e.target.value })}
                  autoFocus
                />
                <Form.Label>Usuario administrador</Form.Label>
                <Form.Check
                  type="switch"
                  defaultChecked={userForEditOrDeletion.admin}
                  onChange={e => setUserForEditOrDeletion({ ...userForEditOrDeletion, admin: e.target.checked })}
                  autoFocus
                />
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  onChange={e => setUserForEditOrDeletion({ ...userForEditOrDeletion, password: e.target.value })}
                  autoFocus
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <ButtonBootstrap variant="secondary" onClick={() => { setEditModalShow(false) }}>
              Cerrar
            </ButtonBootstrap>
            <ButtonBootstrap variant="primary"
              style={{ backgroundColor: '#1976d2' }}
              onClick={() => {
                updateUser(userForEditOrDeletion.id)
              }
              }>
              Guardar cambios
            </ButtonBootstrap>
          </Modal.Footer>
        </Modal>

        <DeleteUserModal
          show={showDeleteModal}
          user={userForEditOrDeletion}
          onHide={onHideDeleteUserModal}
          onDelete={(id) => { deleteUser(id) }}
        />

        <Modal show={newUserModalShow}>
          <Modal.Header >
            <Modal.Title>Alta de usuario</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                <Form.Label>Nombre y apellido</Form.Label>
                <Form.Control
                  type="text"
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  autoFocus
                />
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type='email'
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}

                />
                <Form.Label>Telefono</Form.Label>
                <Form.Control
                  type="phone"
                  onChange={e => setNewUser({ ...newUser, phone: e.target.value })}

                />
                <Form.Label>Pin</Form.Label>
                <Form.Control
                  type="number"
                  onChange={e => setNewUser({ ...newUser, pin: e.target.value })}

                />
                <Form.Label>Usuario administrador</Form.Label>
                <Form.Check
                  type="switch"
                  onChange={e => setNewUser({ ...newUser, admin: e.target.checked })}

                />
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}

                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <ButtonBootstrap variant="secondary" onClick={() => { setNewUserModalShow(false) }}>
              Cerrar
            </ButtonBootstrap>
            <ButtonBootstrap variant="primary"
              style={{ backgroundColor: '#1976d2' }}
              onClick={() => {
                createUser(newUser)
              }
              }>
              Guardar cambios
            </ButtonBootstrap>
          </Modal.Footer>
        </Modal>

        <AssignmentsModal
          show={showAssigmentsModal}
          onHide={onHideAssignmentsModal}
          reservations={reservesByUser}
        />

        <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center' }} open={openSnackError} autoHideDuration={2000} onClose={handleClick}>
          <Alert onClose={handleClick} severity="error" sx={{ width: '100%' }}>
            {snackMessage}
          </Alert>
        </Snackbar>
        <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center' }} open={openSnackSuccess} autoHideDuration={2000} onClose={handleClick}>
          <Alert onClose={handleClick} severity="success" sx={{ width: '100%' }}>
            {snackMessage}
          </Alert>
        </Snackbar>
      </div>


    </div>
  );
}

export default Users;
