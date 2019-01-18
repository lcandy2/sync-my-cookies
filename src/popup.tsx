import React, {Component} from 'react';
import ReactDom from 'react-dom';
const style = require('./popup.scss');
import './global.scss';

import Console from './components/console/console';
import Domains from './components/domain-list/domain-list';
import Setting from './components/setting/setting';

import { Kevast } from 'kevast';
import { KevastChromeLocal, KevastChromeSync } from 'kevast-chrome';
import { KevastEncrypt } from 'kevast-encrypt';
import { KevastGist } from 'kevast-gist';
import * as chromeUtils from './utils/chrome';
import { getDomain } from './utils/util';

const DOMAIN_LIST_KEY = '__DOMAIN_LIST_';

interface State {
  isSetting: boolean;
  currentDomain: string;
  currentUrl: string;
  domainList: string[];
  isRunning: boolean;
}

class Popup extends Component<{}, State> {
  private gist: Kevast;
  private chromeLocal: Kevast;
  private chromeSync: Kevast;
  public constructor(prop: {}) {
    super(prop);
    this.gist = new Kevast(new KevastChromeLocal());
    this.chromeLocal = new Kevast(new KevastChromeLocal());
    this.chromeSync = new Kevast(new KevastChromeSync());
    this.state = {
      isSetting: false,
      currentDomain: '',
      currentUrl: '',
      domainList: [],
      isRunning: false,
    };
  }
  public render() {
    return this.state.isSetting ? (
      <div className={style.wrapper}>
        <Setting onSet={this.handleSet} />
      </div>
    ) : (
      <div className={style.wrapper}>
        <Console
          domain={this.state.currentDomain}
          canMerge={this.state.domainList.includes(this.state.currentDomain)}
          onMerge={this.handleMerge}
          onPush={this.handlePush}
          isRunning={this.state.isRunning}
        />
        <Domains
          domains={this.state.domainList}
          currentDomain={this.state.currentDomain}
          isRunning={this.state.isRunning}
        />
      </div>
    );
  }

  public async componentDidMount() {
    const url = await chromeUtils.getCurrentTabUrl();
    this.setState({
      currentDomain: getDomain(url),
      currentUrl: url,
    });

    await this.initGist();
    this.setState({ isRunning: false });
  }

  private handleMerge = async () => {
    this.setState({ isRunning: true });
    const savedCookie = JSON.parse(await this.gist.get(this.state.currentDomain) || '[]');
    await chromeUtils.importCookies(savedCookie);
    alert('Merged');
    this.setState({ isRunning: false });
  }

  private handlePush = async () => {
    this.setState({ isRunning: true });
    const cookies = await chromeUtils.exportCookies(this.state.currentUrl);
    let domainList = [...this.state.domainList];
    domainList = domainList.filter((domain) => domain !== this.state.currentDomain);
    domainList.unshift(this.state.currentDomain);
    await this.gist.bulkSet([
      {key: DOMAIN_LIST_KEY, value: JSON.stringify(domainList)},
      {key: this.state.currentDomain, value: JSON.stringify(cookies)},
    ]);
    this.setState({
      domainList,
      isRunning: false,
    });
    alert('Pushed');
  }

  private handleSet = async () => {
    this.setState({
      isSetting: false,
    });
    this.initGist();
  }

  private async initGist() {
    const token = await this.chromeSync.get('token');
    const password = await this.chromeSync.get('password');
    if (!token || !password) {
      this.setState({
        isSetting: true,
      });
      return;
    }
    const gistId = await this.chromeSync.get('gistId');
    const filename = await this.chromeSync.get('filename');
    this.gist.add(new KevastGist(token, gistId, filename));
    this.gist.use(new KevastEncrypt(password));
    this.setState({
      domainList: JSON.parse(await this.gist.get(DOMAIN_LIST_KEY) || '[]'),
    });
  }
}

ReactDom.render(
  <Popup />,
  document.getElementById('root'),
);
