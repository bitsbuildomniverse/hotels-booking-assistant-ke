import React from 'react'
import ReactDOM from 'react-dom'
import {BrowserRouter as Router, Route, Link, Switch, Redirect } from 'react-router-dom'
import request from 'superagent'
import styles from './admin.css'
import moment from 'moment'

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import TextField from 'material-ui/TextField'
import RaisedButton from 'material-ui/RaisedButton'
import DatePicker from 'material-ui/DatePicker'
import MenuItem from 'material-ui/MenuItem'
import Toggle from 'material-ui/Toggle'
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table'
import {Tabs, Tab} from 'material-ui/Tabs'
import Snackbar from 'material-ui/Snackbar'

import { resolve } from 'path'

//custom parts
import ModifyDesc from './modifydesc'
import ImageUpload from './imageup'
import ModifyEvent from './modifyevent'

// -------------------------------- Main Page
class AdminApp extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      adminId:"",
      adminToken:"",
      targetid:0
    }
    this.updateAuth = this.updateAuth.bind(this)
    this.updateTarget = this.updateTarget.bind(this)
  }
  //TODO - Check if exact path='/' is right setting
  updateAuth(newId, newToken){
    console.log("token updated to", newToken)
    this.setState({adminId:newId, adminToken:newToken})
  }

  updateTarget(newTarget){
    this.setState({targetid:newTarget})
  }

  render(){
    return (
    <div>
    <Router>
      <MuiThemeProvider>
      <div>
      <AdminNav id={this.state.adminId} />
      <Switch>
        <Route exact path='/admin' render={(props) => <AdminLogin updateAuth={this.updateAuth}/>} />
        <Route path='/admin/control' render={(props) => <AdminControl token={this.state.adminToken} updateTarget={this.updateTarget} />} />
        <Route path='/admin/modifyevent' render={(props) => <ModifyEvent token={this.state.adminToken} targetid={this.state.targetid} createnew={false} /> } />
        <Route path='/admin/modifydesc' render={(props) => <ModifyDesc token={this.state.adminToken} targetid={this.state.targetid} createnew={false} />} />
        <Route path='/admin/createevent' render={(props) =><ModifyEvent token={this.state.adminToken} targetid={this.state.targetid} createnew={true} />} />
        {/* sorry...ths part has to be lazy due to time constraint... 2 - sightseeing 3 - gastronomy*/}
        <Route path='/admin/createdescplace' render={(props) => <ModifyDesc token={this.state.adminToken} targetid={this.state.targetid} createnew={true} category={2} />} />
        <Route path='/admin/createdescfood' render={(props) =><ModifyDesc token={this.state.adminToken} targetid={this.state.targetid} createnew={true} category={3} />} />
        <Route component={ WrongAccess } />
      </Switch>
      </div>
      </MuiThemeProvider>
    </Router>
    </div>
    )
  }
}

// ---------------------------- Main Header(Nav)
class AdminNav extends React.Component {
  constructor(props){
    super(props)
  }
  render(){
    return (
      <div className={styles.nav} > {this.props.id ? 
          <span>???????????? : {this.props.id} </span> 
          : <span>?????? ??????????????? ???????????????</span> }
      </div>
    )
  }
}


//----------------------------- 404 Page
const WrongAccess = () => {
  return (
    <div>????????? ?????? ???????????????.</div>
  )
}


// ----------------------------------- Login Page
class AdminLogin extends React.Component {
  constructor (props){
    super(props)

    this.state = {
      userID: "",
      userPW: "",
      logged:false
    }

    this.updateValues = this.updateValues.bind(this)
    this.loginAttempt = this.loginAttempt.bind(this)
    this.keyhandler = this.keyhandler.bind(this)
  }

  updateValues(e){
    e.preventDefault()
    this.setState({
      [e.target.name]:e.target.value
    })
  }

  keyhandler(e){
    if (e.key === "Enter") this.loginAttempt(e) ;
  }

  loginAttempt(e){
    e.preventDefault()
    console.log("???????????? ??????????????? :",this.state.userID)
    request.get('/admin/login')
            .query({
              userid:this.state.userID,
              userpw:this.state.userPW
            })
            .end((err,data)=>{
              console.log('login finished-token received :' + data.body.token)
              this.props.updateAuth(this.state.userID, data.body.token)
              this.setState({userPW:"",logged:true})
            })
  }

  render(){
    const updateValues = e => this.updateValues(e)
    return(
      <div className={styles.loginwrap}>
        <div>
          <h3>?????????????????? ????????? ?????????</h3>
          <TextField floatingLabelText="????????????" name="userID" onChange={updateValues} onKeyPress={this.keyhandler} /><br />
          <TextField floatingLabelText="????????????" type="password" name="userPW" onChange={updateValues} onKeyPress={this.keyhandler}/><br />
          <RaisedButton label="?????????" onClick={this.loginAttempt} />
          {this.state.logged ? <Redirect to="/admin/control" /> : null }
        </div>
      </div>
    )
  }
}


//----------------------------------------Main Control Page
class AdminControl extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      events:[],
      descs:[],
      eventsShowAll:false,
      modify:0
    }

    this.handleToggle = this.handleToggle.bind(this)
    this.handleTabActive = this.handleTabActive.bind(this)
    this.updateEvent = this.updateEvent.bind(this)
    this.updateDesc = this.updateDesc.bind(this)
    this.activeModifyEvent = this.activeModifyEvent.bind(this)
    this.activeModifyDesc = this.activeModifyDesc.bind(this)
    this.addItem = this.addItem.bind(this)
    this.dbreset = this.dbreset.bind(this)

    this.updateEvent()
  }

  handleToggle(e,toggled){
    this.setState({
      [e.target.name]: toggled
    })
    if(e.target.name === "eventsShowAll"){
     this.updateEvent()
    }
  }

  handleTabActive(tab){
    if(tab.props['data-type'] === "event"){
      this.updateEvent()
    }else if(tab.props['data-type'] === "desc"){
      this.updateDesc()
    }
  }

  updateEvent(){
    request.get('/queryJSON')
    .query({
      type:"event",
      showall:this.state.eventsShowAll
    })
    .end((err,data) => {
      console.log('event query finished', data.body.queryevent)
      this.setState({events:data.body.queryevent})
    })

  }

  updateDesc(){
    request.get('/queryJSON')
    .query({
      type:"desc"
    })
    .end((err,data) => {
      console.log('description query finished', data.body.querydesc)
      this.setState({descs:data.body.querydesc})
    })
  }

  activeModifyEvent(row,column,e){
    this.props.updateTarget(this.state.events[row].eventid)
    this.setState({modify:1})
  }

  activeModifyDesc(row,column,e){
    this.props.updateTarget(this.state.descs[row].descid)
    this.setState({modify:2})
  }

  addItem(e){
    e.preventDefault()
    console.log('updating type:' + e.currentTarget.dataset.type)
    let routeNo = 0
    let idType = ''
    if(e.currentTarget.dataset.type === 'promo'){
      routeNo = 3
      idType = 'eventlastid'
    }else if(e.currentTarget.dataset.type === 'place'){
      routeNo = 4
      idType = 'desclastid'
    }else if(e.currentTarget.dataset.type === 'food'){
      routeNo = 5
      idType = 'desclastid'
    }
    request.get('/queryJSON')
    .query({
      type:idType
    })
    .end((err,data)=>{
      console.log('last id fetched :',data.body.querylastid)
      this.props.updateTarget(data.body.querylastid + 1)
      this.setState({modify:routeNo})
    })
  }

  dbreset(e){
    e.preventDefault()
    request.get('/dbreset')
    .query({
      token:this.props.token
    })
    .end((err,data)=>{
      console.log('db has been reset')
      this.forceUpdate();
    })
  }

  render(){
    const category = ['??????(?????? ??????)', '??????(?????? ??????)', '?????? ???????????? ??????', '?????? ?????? ??????']
    return (
      <div>
      <Tabs>

        {/* ---------------------event and promotion list-----------------------  */}
        <Tab label="????????? ??? ????????????" data-type="event" onActive={this.handleTabActive}>
          <Table selectable={false} onCellClick={this.activeModifyEvent}>
            <TableHeader displaySelectAll={false}>
              <TableRow>
                <TableHeaderColumn>????????????</TableHeaderColumn>
                <TableHeaderColumn>?????????</TableHeaderColumn>
                <TableHeaderColumn>?????????</TableHeaderColumn>
                <TableHeaderColumn>?????????</TableHeaderColumn>
                <TableHeaderColumn>?????? ??????</TableHeaderColumn>
              </TableRow>
            </TableHeader>
            <TableBody showRowHover={true}>
              {this.state.events.map((row, index) => (
                <TableRow key={index}>
                  <TableRowColumn>{row.title}</TableRowColumn>
                  <TableRowColumn>{moment(row.datestart).format('YYYY-MM-DD')}</TableRowColumn>
                  <TableRowColumn>{moment(row.dateend).format('YYYY-MM-DD')}</TableRowColumn>
                  <TableRowColumn>{row.priority}</TableRowColumn>
                  <TableRowColumn>{row.enabled ? '?????????' : '?????? ??????'}</TableRowColumn>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <br />
          {this.state.events.length <= 0 ? <div>????????? ??????????????? ?????? ????????????</div> : null}
          <hr />
          <Toggle name="eventsShowAll" label="????????? ???????????? ?????? ???????????? ?????? ??????"
            onToggle={this.handleToggle} defaultToggled={this.state.eventsShowAll} labelPosition="right"/>
          <RaisedButton label="????????? ???????????? ????????????" onClick={this.addItem} data-type="promo"/>
        </Tab>
        
        {/* ------------------------description list-----------------------------  */}

        <Tab label="????????? ?????? ??????" data-type="desc" onActive={this.handleTabActive}>
          <Table selectable={false} onCellClick={this.activeModifyDesc}>
            <TableHeader displaySelectAll={false}>
              <TableRow>
                <TableHeaderColumn>????????????</TableHeaderColumn>
                <TableHeaderColumn>?????? ??????</TableHeaderColumn>
                <TableHeaderColumn>??????</TableHeaderColumn>
                <TableHeaderColumn>?????? ??????</TableHeaderColumn>
              </TableRow>
            </TableHeader>
            <TableBody showRowHover={true}>
              {this.state.descs.map((row,index) => (
                <TableRow key={index}>
                  <TableRowColumn>{category[row.category]}</TableRowColumn>
                  <TableRowColumn>{row.title}</TableRowColumn>
                  <TableRowColumn>{row.context.slice(0,20)}...</TableRowColumn>
                  <TableRowColumn>{moment(row.dateedit).format('YYYY-MM-DD')}</TableRowColumn>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <RaisedButton label="????????? ?????? ????????????" onClick={this.addItem} data-type="place"/>
          <RaisedButton label="????????? ?????? ????????????" onClick={this.addItem} data-type="food"/>
        </Tab>
      </Tabs>
      {this.state.modify === 1 ? <Redirect to="/admin/modifyevent" /> : null }
      {this.state.modify === 2 ? <Redirect to="/admin/modifydesc" /> : null }
      {this.state.modify === 3 ? <Redirect to="/admin/createevent" /> : null }
      {this.state.modify === 4 ? <Redirect to="/admin/createdescplace" /> : null}
      {this.state.modify === 5 ? <Redirect to="/admin/createdescfood" /> : null}
      <RaisedButton label="?????? ?????? ???????????????" onClick={this.dbreset} />
      </div>
    )
  }
}


ReactDOM.render(<AdminApp />,document.getElementById('root'))