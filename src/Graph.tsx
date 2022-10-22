import React, { Component } from 'react';
import { Table, TableData } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import { DataManipulator } from './DataManipulator';
import './Graph.css';

interface IProps {
  data: ServerRespond[],
}

interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void,
}
class Graph extends Component<IProps, {}> {
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    // Get element from the DOM.
    const elem = document.getElementsByTagName('perspective-viewer')[0] as unknown as PerspectiveViewerElement;

    const schema = {
      // These two prices are needed to calculate the ratio, although we won't be directly displaying them on our graph
      // to the user / trader.
      price_abc: 'float',
      price_def: 'float',
      // So that we can track the ratio between the two fields.
      ratio: 'float',
      // As we are tracking the ratio with respect to time.
      timestamp: 'date',
      upper_bound: 'float',
      lower_bound: 'float',
      // This is when these bounds are crossed.
      trigger_alert: 'float'
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.
      elem.load(this.table);
      elem.setAttribute('view', 'y_line');
      // This allows us to map each datapoint based on its timestamp, allows us to have a scale on the x-axis.
      elem.setAttribute('row-pivots', '["timestamp"]');
      // These are the things that we want to track along the y-axis.
      elem.setAttribute('columns', '["ratio", "lower_bound", "upper_bound", "trigger_alert"]');
      // Aggregates let us deal with duplicate data that we don't want to be plotted twice.
      elem.setAttribute('aggregates', JSON.stringify({
        // We have added various attributes to the element.
        price_abc: 'avg',
        price_def: 'avg',
        ratio: 'avg',
        timestamp: 'distinct count',
        upper_bound: 'avg',
        lower_bound: 'avg',
        trigger_alert: 'avg',
      }));
    }
  }

  // This gets executed whenever the graph gets new data.
  componentDidUpdate() {
    if (this.table) {
      this.table.update([
        DataManipulator.generateRow(this.props.data),
      ] as unknown as TableData);
    }
  }
}

export default Graph;
