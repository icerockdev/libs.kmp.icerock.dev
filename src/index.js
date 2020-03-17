/*
 * Copyright 2020 IceRock MAG Inc. Use of this source code is governed by the Apache 2.0 license.
 */

import React from 'react';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CssBaseline from '@material-ui/core/CssBaseline';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Link from '@material-ui/core/Link';
import * as ReactDOM from "react-dom";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {'Copyright © '}
      <Link color="inherit" href="https://icerock.dev/">
        IceRock Development
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const useStyles = makeStyles(theme => ({
  icon: {
    marginRight: theme.spacing(2),
  },
  heroContent: {
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(8, 0, 6),
  },
  heroButtons: {
    marginTop: theme.spacing(4),
  },
  cardGrid: {
    paddingTop: theme.spacing(8),
    paddingBottom: theme.spacing(8),
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardMedia: {
    paddingTop: '56.25%', // 16:9
  },
  cardContent: {
    flexGrow: 1,
  },
  footer: {
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(6),
  },
}));

class Body extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      libraries: null,
      selectedKotlinVersion: null,
      selectedCategory: null
    };
  }

  componentDidMount() {
    fetch("data.json")
      .then(response => response.json())
      .then(libraries => {
        this.setState({libraries: libraries});
      })
      .catch(error => {
        // let textNode = document.createTextNode(error);
        // content.appendChild(textNode);
      });
  }

  render() {
    const libraries = this.state.libraries;
    const handleKotlinVersionChange = event => {
      let newState = this.state;
      newState.selectedKotlinVersion = event.target.value;
      this.setState(newState);
    };
    const handleCategoryChange = event => {
      let newState = this.state;
      newState.selectedCategory = event.target.value;
      this.setState(newState);
    };

    let containerButtons;
    let containerGrid;
    if (libraries == null) {
      containerButtons = <div/>;
      containerGrid = <Grid container spacing={4}/>;
    } else {
      let kotlinVersions = libraries
        .flatMap(library => library.versions)
        .map(libraryVersion => libraryVersion.kotlin)
        .filter((v, i, a) => a.indexOf(v) === i);
      let categories = libraries
        .map(library => library.category)
        .filter((v, i, a) => a.indexOf(v) === i);

      let filterStyle = {
        minWidth: 120
      };

      containerButtons = <div className={this.props.classes.heroButtons}>
        <Grid container spacing={2} justify="center">
          <Grid item>
            <FormControl variant="outlined" style={filterStyle}>
              <InputLabel>Kotlin</InputLabel>
              <Select
                id="kotlin-version-selector"
                value={this.state.selectedKotlinVersion}
                onChange={handleKotlinVersionChange}
                labelWidth={120}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {kotlinVersions.map(version => <MenuItem value={version}>{version}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item>
            <FormControl variant="outlined" style={filterStyle}>
              <InputLabel>Category</InputLabel>
              <Select
                id="category-version-selector"
                value={this.state.selectedCategory}
                onChange={handleCategoryChange}
                labelWidth={120}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {categories.map(item => <MenuItem value={item}>{item}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </div>;

      let category = this.state.selectedCategory;
      let kotlin = this.state.selectedKotlinVersion;
      let filterLibraries = libraries.filter(library => {
        return library.category === category || category === "" || category == null
      }).map(library => {
        let newLib = {};
        Object.assign(newLib, library);
        newLib.versions = library.versions.filter(version => {
          return version.kotlin === kotlin || kotlin === "" || kotlin == null
        });
        return newLib;
      }).filter(lib => lib.versions.length > 0);

      let items = filterLibraries.map(library => {
        let name = library.path;
        let latestVersion = library.versions[library.versions.length - 1];
        let platforms = Object.keys(latestVersion.targets)
          .map(key => {
            let target = latestVersion.targets[key];
            if (target.target != null) return target.target;
            else return target.platform;
          })
          .filter((v, i, a) => a.indexOf(v) === i);

        let latestVersionName = "Latest: " + latestVersion.version;
        let kotlin = "Kotlin:" + latestVersion.kotlin;
        let targets = "Targets: " + platforms.join(", ");

        return <Grid item key={library} xs={12} sm={6} >
          {/*md={4}*/}
          <Card className={this.props.classes.card}>
            {/*<CardMedia*/}
            {/*  className={this.props.classes.cardMedia}*/}
            {/*  image="https://source.unsplash.com/random"*/}
            {/*  title="Image title"*/}
            {/*/>*/}
            <CardContent className={this.props.classes.cardContent}>
              <Typography gutterBottom variant="h5" component="h2">
                {name}
              </Typography>
              <Typography>{latestVersionName}</Typography>
              <Typography>{kotlin}</Typography>
              <Typography>{targets}</Typography>
            </CardContent>
            <CardActions>
              <Button size="small" color="primary" href={library.github} target={"_blank"}>
                GitHub
              </Button>
            </CardActions>
          </Card>
        </Grid>;
      });

      containerGrid = <Grid container spacing={4}>{items}</Grid>;
    }

    return (
      <main>
        {/* Hero unit */}
        <div className={this.props.classes.heroContent}>
          <Container maxWidth="sm">
            <Typography component="h1" variant="h2" align="center" color="textPrimary" gutterBottom>
              Kotlin Multiplatform libraries
            </Typography>
            <Typography variant="h5" align="center" color="textSecondary" paragraph>
              Here is list of Kotlin Multiplatform libraries with auto-fetch information directly from maven
              repositories.
            </Typography>
            {containerButtons}
          </Container>
        </div>
        <Container className={this.props.classes.cardGrid} maxWidth="md">
          {/* End hero unit */}
          {containerGrid}
        </Container>
      </main>
    );
  }
}

function App() {
  const classes = useStyles();

  return (
    <React.Fragment>
      <CssBaseline/>
      <Body classes={classes}/>
      {/* Footer */}
      <footer className={classes.footer}>
        {/*<Typography variant="h6" align="center" gutterBottom>*/}
        {/*  Footer*/}
        {/*</Typography>*/}
        {/*<Typography variant="subtitle1" align="center" color="textSecondary" component="p">*/}
        {/*  Something here to give the footer a purpose!*/}
        {/*</Typography>*/}
        <Copyright/>
      </footer>
      {/* End footer */}
    </React.Fragment>
  );
}

ReactDOM.render(<App/>, document.querySelector("#app"));
