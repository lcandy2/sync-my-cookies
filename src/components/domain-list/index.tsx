import React, { Component } from 'react';
const style = require('./index.scss');
import Domain from '../domain';

interface Prop {
  domains: string[];
  currentDomain: string;
  isRunning: boolean;
}

class DomainList extends Component<Prop> {
  public render() {
    return (
      <div className={style.wrapper}>
        {this.props.domains[0] === this.props.currentDomain && <div className={style.pointer} />}
        {this.renderList(this.props.domains, this.props.currentDomain)}
      </div>
    );
  }
  private renderList = (domains: string[], active: string) => {
    return domains.map((domain) => {
      return (
        <Domain
          key={domain}
          className={style.domain}
          domain={domain}
          active={domain === active}
        />
      );
    });
  }
}

export default DomainList;