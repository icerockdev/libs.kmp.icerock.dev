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
import GitHubButton from 'react-github-btn';
import StackGrid from "react-stack-grid";

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

function SubmitButton() {
  let style = {
    margin: "0 16px",
    width: "fit-content",
    display: "block"
  };
  return <Button
    variant="contained"
    color="primary"
    style={style}
    href="https://github.com/icerockdev/multiplatform-libraries#how-to-add-own-lib"
    target="_blank"
  >
    Submit library
  </Button>;
}

function SiteButtons() {
  let style = {
    margin: "0 auto 16px",
    display: "flex",
    "justify-content": "center",
    "align-items": "center"
  };
  return <div style={style}>
    <GitHubButton
      href="https://github.com/icerockdev/multiplatform-libraries"
      data-icon="octicon-star"
      data-size="large"
      data-show-count="true"
      aria-label="Star icerockdev/multiplatform-libraries on GitHub"
    >Star</GitHubButton>
    <SubmitButton/>
    <GitHubButton
      href="https://github.com/icerockdev/multiplatform-libraries/subscription"
      data-icon="octicon-eye"
      data-size="large"
      data-show-count="true"
      aria-label="Watch icerockdev/multiplatform-libraries on GitHub"
    >Watch</GitHubButton>
  </div>
}

function LibraryCard(library, latestVersion, targets) {
  let descriptionStyle = {
    margin: "8px 0"
  };
  let titleStyle = {
    display: "flex",
    "justify-content": "space-between"
  };

  return <Card className={this.props.classes.card}>
    <CardContent className={this.props.classes.cardContent}>
      <Typography gutterBottom variant="h5" component="h2" style={titleStyle}>
        {library.github.name}
        <Typography variant="subtitle1">★ {library.github.stars_count}</Typography>
      </Typography>
      <Typography style={descriptionStyle}>{library.github.description}</Typography>
      <Typography>Category: {library.category}</Typography>
      <Typography>Gradle: {library.path + ":" + latestVersion.version}</Typography>
      <Typography>Kotlin: {latestVersion.kotlin}</Typography>
      <Typography>Targets: {targets}</Typography>
    </CardContent>
    <CardActions>
      <Button size="small" color="primary" href={library.github.html_url} target={"_blank"}>
        GitHub
      </Button>
    </CardActions>
  </Card>;
}

class Body extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      libraries: null,
      selectedKotlinVersion: null,
      selectedCategory: null,
      selectedTarget: null
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
    const updateState = newState => {
      // FIXME remove duplicated call (now used for correct relayout of cards grid)
      this.setState(newState);
      const self = this;
      setTimeout(function() {
        self.setState(newState);
      }, 50)
    }
    const handleKotlinVersionChange = event => {
      let newState = this.state;
      newState.selectedKotlinVersion = event.target.value;
      updateState(newState);
    };
    const handleCategoryChange = event => {
      let newState = this.state;
      newState.selectedCategory = event.target.value;
      updateState(newState);
    };
    const handleTargetChange = event => {
      let newState = this.state;
      newState.selectedTarget = event.target.value;
      updateState(newState);
    };

    let containerButtons;
    let containerGrid;
    if (libraries == null) {
      containerButtons = <div/>;
      containerGrid = <Grid container spacing={4}/>;
    } else {
      let kotlinVersions = libraries
        .flatMap(library => library.versions)
        .filter(libraryVersion => libraryVersion.mpp === true)
        .map(libraryVersion => libraryVersion.kotlin)
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort()
        .sort((a, b) => {
          if(a.includes("-")) return 1;
          else return -1;
        });
      let categories = libraries
        .map(library => library.category)
        .filter((v, i, a) => a.indexOf(v) === i);
      let targets = libraries
        .flatMap(library => library.versions)
        .filter(libraryVersion => libraryVersion.mpp === true)
        .flatMap(libraryVersion => Object.values(libraryVersion.targets))
        .map(target => target.target)
        .filter((v, i, a) => a.indexOf(v) === i);

      let category = this.state.selectedCategory;
      let kotlin = this.state.selectedKotlinVersion;
      let target = this.state.selectedTarget;
      let filterLibraries = libraries.filter(library => {
        return category === "" || category == null || library.category === category;
      }).map(library => {
        let newLib = {};
        Object.assign(newLib, library);
        newLib.versions = library.versions
            .filter(libraryVersion => libraryVersion.mpp === true)
            .filter(version => {
              return kotlin === "" || kotlin == null || version.kotlin === kotlin;
            })
            .filter(version => {
              return target == null || target === "" || Object.values(version.targets).map(target => target.target).includes(target);
            });
        return newLib;
      }).filter(lib => lib.versions.length > 0);

      let filterStyle = {
        minWidth: 120
      };
      let resultsCountStyle = {
        margin: "16px auto 0",
        width: "fit-content"
      };

      containerButtons = <div className={this.props.classes.heroButtons}>
        <SiteButtons/>
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
          <Grid item>
            <FormControl variant="outlined" style={filterStyle}>
              <InputLabel>Target</InputLabel>
              <Select
                id="target-version-selector"
                value={this.state.selectedTarget}
                onChange={handleTargetChange}
                labelWidth={120}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {targets.map(item => <MenuItem value={item}>{item}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Typography style={resultsCountStyle}>Results: {filterLibraries.length}</Typography>
      </div>;

      let items = filterLibraries
        .sort((a, b) => {
          if (a.github.stars_count === b.github.stars_count) return 0;
          else if (a.github.stars_count > b.github.stars_count) return -1;
          else return 1;
        })
        .map(library => {
          let latestVersion = library.versions[library.versions.length - 1];
          let platforms = Object.keys(latestVersion.targets)
            .map(key => {
              let target = latestVersion.targets[key];
              if (target.target != null) return target.target;
              else return target.platform;
            })
            .filter((v, i, a) => a.indexOf(v) === i);

          let targets = platforms.join(", ");

          return LibraryCard.call(this, library, latestVersion, targets);
        });

      const isMobile = window.innerWidth < 480;

      containerGrid = <StackGrid
        columnWidth={isMobile ? "100%" : "50%"}
        gutterWidth={16}
        gutterHeight={16}
        container
      >{items}</StackGrid>;
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
              Here is a list of Kotlin Multiplatform libraries with auto-fetch information directly from maven
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
        <Copyright/>
      </footer>
      {/* End footer */}
    </React.Fragment>
  );
}

ReactDOM.render(<App/>, document.querySelector("#app"));
