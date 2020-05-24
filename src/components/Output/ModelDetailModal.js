import React, {Component} from "react";
import {Modal, Button} from "react-bootstrap";
import {inject, observer} from "mobx-react";
import {toJS} from "mobx"

@inject("store")
@observer
class ModelDetailModal extends Component {
    toggleModelDetailModal = () => {
        this.props.store.toggleModelDetailModal();
    };
    render() {
        const {store} = this.props;
        return (
            <div>
                <div className="container-fluid">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <Modal
                                show={store.modelDetailModal}
                                onHide={this.toggleModelDetailModal}
                                size="xl"
                                aria-labelledby="contained-modal-title-vcenter"
                                centered>
                                <Modal.Header>
                                    <Modal.Title id="contained-modal-title-vcenter">
                                        {" "}
                                        Model details
                                        <Button
                                            className=" close"
                                            aria-label="Close"
                                            style={{float: "right"}}
                                            onClick={() => this.toggleModelDetailModal()}>
                                            <span aria-hidden="true">&times;</span>
                                        </Button>
                                    </Modal.Title>
                                </Modal.Header>

                                <Modal.Body>
                                    <div>
                                        <div className="row">
                                            <div className="col col-sm-5">
                                                <table className="table table-bordered">
                                                    <thead>
                                                        <tr>
                                                            <th colSpan="2">Info</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Object.keys(store.infoTable).map(
                                                            (dev, i) => {
                                                                return [
                                                                    <tr key={i}>
                                                                        <td>{dev}</td>
                                                                        <td>
                                                                            {store.infoTable[dev]}
                                                                        </td>
                                                                    </tr>,
                                                                ];
                                                            }
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="col col-sm-3">
                                                <table className="table table-bordered">
                                                    <thead>
                                                        <tr>
                                                            <th colSpan="2">Model Options</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                    {Object.keys(store.optionSettings).map(
                                                            (dev, i) => {
                                                                return [
                                                                    <tr key={i}>
                                                                        <td>{dev}</td>
                                                                        <td>
                                                                            {store.optionSettings[dev]}
                                                                        </td>
                                                                    </tr>,
                                                                ];
                                                            }
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="col col-sm-4">
                                                <table className="table table-bordered">
                                                    <thead>
                                                        <tr>
                                                            <th colSpan="2">Model Data</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                    {Object.keys(store.modelData).map(
                                                            (dev, i) => {
                                                                return [
                                                                    <tr key={i}>
                                                                        <td>{dev}</td>
                                                                        <td>
                                                                            {store.modelData[dev]}
                                                                        </td>
                                                                    </tr>,
                                                                ];
                                                            }
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col col-sm-4">
                                                <table className="table table-bordered">
                                                    <thead>
                                                        <tr>
                                                            <th colSpan="2">Benchmark Dose</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                    {Object.keys(store.benchmarkDose).map(
                                                            (dev, i) => {
                                                                return [
                                                                    <tr key={i}>
                                                                        <td>{dev}</td>
                                                                        <td>
                                                                            {store.benchmarkDose[dev]}
                                                                        </td>
                                                                    </tr>,
                                                                ];
                                                            }
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="col col-sm-6"></div>
                                        </div>

                                        <div className="row">
                                            <div className="col col-sm-4">
                                                <table className="table table-bordered">
                                                    <thead>
                                                        <tr>
                                                            <th>Dose</th>
                                                            <th>Estimated Probability</th>
                                                            <th>Expected</th>
                                                            <th>Observed</th>
                                                            <th>size</th>
                                                            <th>Scaled Residual</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {store.goodnessFit.map((row, index) => {
                                                            return [
                                                                <tr key={index}>
                                                                    <td>{row.dose}</td>
                                                                    <td>{row.est_prob}</td>
                                                                    <td>{row.expected}</td>
                                                                    <td>{row.observed}</td>
                                                                    <td>{row.size}</td>
                                                                    <td>{row.scaled_residual}</td>
                                                                </tr>,
                                                            ];
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col col-sm-2">
                                                <table className="table table-bordered">
                                                    <thead>
                                                        <tr>
                                                            <th>Percentile</th>
                                                            <th>BMD</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {store.cdfValues.map((value,i)=>{
                                                            return[
                                                           <tr key={i}>
                                                               <td>{value.pValue}</td>
                                                               <td>{value.cdf}</td>
                                                           </tr>
                                                           ]
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </Modal.Body>
                            </Modal>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default ModelDetailModal;
