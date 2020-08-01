import React, {Component} from "react";
import Moment from "moment";
import "jquery-ui/ui/widgets/datepicker";
import "jquery-ui/ui/i18n/datepicker-ko";
import {withDateRangeProperties} from "../provider/DashboardDateProvider";

const ID_START_DATE = "#startdate";
const ID_END_DATE = "#enddate";

const initializeButtons = function (parent) {
    let today = Moment().format();

    initRangeField(ID_START_DATE);
    initRangeField(ID_END_DATE);

    $([ID_START_DATE, ID_END_DATE].join(", "))
        .datepicker("setDate", today)
        .on("change", () => {
            const startDate = getStartDate();
            const endDate = getEndDate();

            if (startDate.getTime() > endDate.getTime()) {
                parent.setState({buttonDisabled: true})
            } else {
                parent.setState({buttonDisabled: false})
            }
        });

    $("#btnRefresh").click(
        () => {
            const startValue = getStartDateElement().val();
            const endValue = getEndDateElement().val();

            parent.props.setDateRange(startValue, endValue);
        }
    );

    function getStartDateElement() {
        return $(ID_START_DATE);
    }

    function getEndDateElement() {
        return $(ID_END_DATE);
    }

    function getStartDate() {
        const dateParts = getStartDateElement().val().split("-");
        return new Date(dateParts[0], dateParts[1], dateParts[2], 0, 0, 0);
    }

    function getEndDate() {
        const dateParts = getEndDateElement().val().split("-");
        return new Date(dateParts[0], dateParts[1], dateParts[2], 23, 59, 59);
    }

    function initRangeField(id) {
        const bodyElement = $(id);
        const buttonElement = $(id + "Btn");

        bodyElement
            .attr("readonly", true)
            .datepicker(parent.options);

        buttonElement.click(
            () => {
                if ($("#ui-datepicker-div").css("display") == "block") {
                    bodyElement.datepicker("hide");
                } else {
                    bodyElement.datepicker("show");
                }
            }
        );
    }
}

class DashboardDatePicker extends Component {
    constructor(props) {
        super(props);
        this.options = {
            showAnim: "slideDown",
            dateFormat: "yy-mm-dd",
            maxDate: "0",
            minDate: "-6m"
        };
        this.state = {
            buttonDisabled: false
        }
    }

    componentDidMount() {
        initializeButtons(this);
    }

    render() {
        return (
            <React.Fragment>
                <div className="row contents">
                    <div className="datepick-set">
                        <form>
                            <div className="input-group cal-style">
                                <input type="text" className="form-control input-sm" id="startdate" readOnly="readonly"/>
                                <span className="input-group-btn">
                                <button id="startdateBtn" className="btn btn-default btn-cal btn-sm" type="button">
                                    <i className="fa fa-calendar" aria-hidden="true"/>
                                </button>
                            </span>
                            </div>
                            <div className="cal-between">~</div>
                            <div className="input-group cal-style">
                                <input type="text" className="form-control input-sm" id="enddate" readOnly="readonly"/>
                                <span className="input-group-btn">
                                <button id="enddateBtn" className="btn btn-default btn-cal btn-sm" type="button">
                                    <i className="fa fa-calendar" aria-hidden="true"/>
                                </button>
                            </span>
                            </div>
                            <button id="btnRefresh" className="btn btn-default btn-sm ml10" type="button"
                                    disabled={this.state.buttonDisabled}
                            >
                                <i className="fa fa-repeat" aria-hidden="true"/>
                            </button>
                            {/*<button className="btn btn-default btn-sm btn-import"
                                style={{height: "32px", width: "38px"}}
                                title="다운로드">
                            <i className="fa fa-download" aria-hidden="true"/>
                        </button>*/}
                        </form>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default withDateRangeProperties(DashboardDatePicker);
