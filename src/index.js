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
    };
  }

  componentDidMount() {
    fetch("data.json")
      .then(response => response.json())
      .then(libraries => {
        this.setState({libraries: libraries});

        // libraries.forEach(library => {
        // let cardRoot = template.cloneNode(true);
        // cardRoot.attributes.removeNamedItem("id");
        //
        // let titleNode = cardRoot.querySelector("#library-title");
        // titleNode.attributes.removeNamedItem("id");
        // titleNode.textContent = library.groupId + ":" + library.artifactId;
        //
        // let descriptionNode = cardRoot.querySelector("#library-description");
        // descriptionNode.attributes.removeNamedItem("id");
        // descriptionNode.textContent = null;
        // library.versions.forEach(version => {
        //   let versionParagraph = document.createElement("p");
        //   let platforms = Object.keys(version.targets)
        //     .map(key => {
        //       let target = version.targets[key];
        //       if (target.target != null) return target.target;
        //       else return target.platform;
        //     })
        //     .filter((v, i, a) => a.indexOf(v) === i)
        //     .reduce((result, platform) => result + ", " + platform, "");
        //   versionParagraph.textContent = version.version + " - kotlin " + version.kotlin + platforms;
        //   descriptionNode.appendChild(versionParagraph);
        // });
        //
        // let githubLinkNode = cardRoot.querySelector("#library-github");
        // githubLinkNode.attributes.removeNamedItem("id");
        // githubLinkNode.setAttribute("href", library.github);
        //
        // componentHandler.upgradeElement(cardRoot);
        // content.appendChild(cardRoot);
        // });
      })
      .catch(error => {
        // let textNode = document.createTextNode(error);
        // content.appendChild(textNode);
      });
  }

  render() {
    const libraries = this.state.libraries;
    let containerButtons;
    let containerGrid;
    if (libraries == null) {
      containerButtons = <div/>;
      containerGrid = <Grid container spacing={4}/>;
    } else {
      containerButtons = <div className={this.props.classes.heroButtons}>
        <Grid container spacing={2} justify="center">
          <Grid item>
            <Button variant="contained" color="primary">
              Main call to action
            </Button>
          </Grid>
          <Grid item>
            <Button variant="outlined" color="primary">
              Secondary action
            </Button>
          </Grid>
        </Grid>
      </div>;

      let items = libraries.map(library => {
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
