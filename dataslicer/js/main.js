/**
 * Created by admin on 2/18/14.
 */
var ADDRESS_LABEL = "DEVICE_APP_ADDRESS";
var dataArray = [];
var currentSelectedRow = null;
var dbManager = new DbManager();
// global chart

// create global chart variable
var accelerationDataChart ;
var timeRangeSelectChart ;
var gyroscopeDataChart ;
//var gyroscopeRangeSelectChart = dc.barChart("#gyroscope_range_select_chart");
var magneticFieldDataChart;
//var magneticFieldRangeSelectChart = dc.barChart("#magnetic_field_range_select_chart");
var motionIntensityByLabelChart;
var signalMagnitudeAreaByLabelChart;
var rangeFilter;


function initChart(data) {
    accelerationDataChart = dc.lineChart("#acceleration_data_chart");
    timeRangeSelectChart = dc.barChart("#time_range_select_chart");
    gyroscopeDataChart = dc.lineChart("#gyroscope_data_chart");
    magneticFieldDataChart = dc.lineChart("#magnetic_field_data_chart");
    motionIntensityByLabelChart = dc.rowChart("#motion_intensity_chart");
    signalMagnitudeAreaByLabelChart = dc.rowChart("#signal_magnitude_area_chart");

    var startTime = new Date(data[0].time);
    var endTime = new Date(data[data.length-1].time);

    // create crossfilter dimensions
    var ndx = crossfilter(data);
    var timeDimension = ndx.dimension(function(d) {
        return new Date(+d.time);
    });
    var timeDimensionGroup = timeDimension.group();

    var labelDimension = ndx.dimension(function(d) {
        return "Label " + d.label;
    });

    function computeMI(v) {
        return  Math.sqrt(+v.linear_acceleration[0]*+v.linear_acceleration[0]
            + +v.linear_acceleration[1]*+v.linear_acceleration[1]
            + +v.linear_acceleration[2]*+v.linear_acceleration[2]);
//        return 5;
    }
    var labelGroupByMI = labelDimension.group();
    labelGroupByMI.reduce(
        function(p, v) {
            p.count++;
            p.totalMI += computeMI(v);
            return p;
        },
        function(p, v) {
            p.count--;
            p.totalMI -= computeMI(v);
            return p;
        },
        function() {
            return {
                count : 0,
                totalMI : 0
            }
        }
    );

    function computeSMA(v) {
        return  Math.abs(+v.linear_acceleration[0])
            +  Math.abs(+v.linear_acceleration[1])
            + Math.abs(+v.linear_acceleration[2])
//        return 5;
    }
    var labelGroupBySMA = labelDimension.group();
    labelGroupBySMA.reduce(
        function(p, v) {
            p.count++;
            p.totalSMA += computeSMA(v);
            return p;
        },
        function(p, v) {
            p.count--;
            p.totalSMA -= computeSMA(v);
            return p;
        },
        function() {
            return {
                count : 0,
                totalSMA : 0
            }
        }
    );


    var linearAccelerationXDimensionGroup  = timeDimension.group().reduceSum(function(d) {return +d.linear_acceleration[0]});
    var linearAccelerationYDimensionGroup  = timeDimension.group().reduceSum(function(d) {return +d.linear_acceleration[1]});
    var linearAccelerationZDimensionGroup  = timeDimension.group().reduceSum(function(d) {return +d.linear_acceleration[2]});

    var gyroscopeXDimensionGroup  = timeDimension.group().reduceSum(function(d) {return +d.gyroscope[0]});
    var gyroscopeYDimensionGroup  = timeDimension.group().reduceSum(function(d) {return +d.gyroscope[1]});
    var gyroscopeZDimensionGroup  = timeDimension.group().reduceSum(function(d) {return +d.gyroscope[2]});

    var magneticFieldXDimensionGroup  = timeDimension.group().reduceSum(function(d) {return +d.magnetic[0]});
    var magneticFieldYDimensionGroup  = timeDimension.group().reduceSum(function(d) {return +d.magnetic[1]});
    var magneticFieldZDimensionGroup  = timeDimension.group().reduceSum(function(d) {return +d.magnetic[2]});

    motionIntensityByLabelChart
        .width(600) // (optional) define chart width, :default = 200
        .height(200)  // (optional) define chart height, :default = 200
        .margins({top: 10, right: 50, bottom : 30, left: 20})
        .dimension(labelDimension)
        .group(labelGroupByMI, "Motion Intensity")
        .valueAccessor(function(p) {
            return p.value.totalMI / p.value.count;
        });

    signalMagnitudeAreaByLabelChart
        .width(600) // (optional) define chart width, :default = 200
        .height(200)  // (optional) define chart height, :default = 200
        .margins({top: 10, right: 50, bottom : 30, left: 20})
        .dimension(labelDimension)
        .group(labelGroupBySMA, "Signal Magnitude Area")
        .valueAccessor(function(p) {
            return p.value.totalSMA / p.value.count;
        });


    accelerationDataChart
        .width(600) // (optional) define chart width, :default = 200
        .height(450)  // (optional) define chart height, :default = 200
        .margins({top: 10, right: 50, bottom : 30, left: 40})
        .x(d3.time.scale().domain([startTime, endTime]))
//        .elasticY(true)
        .legend(dc.legend().x(50).y(10).itemHeight(13).gap(5))
        .stack(linearAccelerationYDimensionGroup, "Linear Acceleration Y")
        .stack(linearAccelerationZDimensionGroup, "Linear Acceleration Z")
        .mouseZoomable(true)
        .brushOn(false)
        .rangeChart(timeRangeSelectChart)
        .dimension(timeDimension)
        .group(linearAccelerationXDimensionGroup, "Linear Acceleration X");
    accelerationDataChart.on("filtered", function(chart, filter) {
        rangeFilter = filter;
        gyroscopeDataChart.focus(filter);
        magneticFieldDataChart.focus(filter);
    });

    gyroscopeDataChart
        .width(600) // (optional) define chart width, :default = 200
        .height(450)  // (optional) define chart height, :default = 200
        .margins({top: 10, right: 50, bottom : 30, left: 40})
        .x(d3.time.scale().domain([startTime, endTime]))
//        .elasticY(true)
        .legend(dc.legend().x(50).y(10).itemHeight(13).gap(5))
        .stack(gyroscopeYDimensionGroup, "Gyroscope Y")
        .stack(gyroscopeZDimensionGroup, "Gyroscope Z")
//        .mouseZoomable(true)
        .brushOn(false)
//        .rangeChart(gyroscopeRangeSelectChart)
        .dimension(timeDimension)
        .group(gyroscopeXDimensionGroup, "Gyroscope X");
//
    magneticFieldDataChart
        .width(600) // (optional) define chart width, :default = 200
        .height(450)  // (optional) define chart height, :default = 200
        .margins({top: 10, right: 50, bottom : 30, left: 40})
        .x(d3.time.scale().domain([startTime, endTime]))
//        .elasticY(true)
        .legend(dc.legend().x(50).y(10).itemHeight(13).gap(5))
        .stack(magneticFieldYDimensionGroup, "Magnetic Field Y")
        .stack(magneticFieldZDimensionGroup, "Magnetic Field Z")
//        .mouseZoomable(true)
        .brushOn(false)
//        .rangeChart(magneticFieldRangeSelectChart)
        .dimension(timeDimension)
        .group(magneticFieldXDimensionGroup, "Magnetic Field X");

    timeRangeSelectChart
        .width(1800)
        .height(70)
        .margins({top: 0, right: 50, bottom: 20, left: 40})
        .dimension(timeDimension)
        .group(timeDimensionGroup, "Time")
        .centerBar(true)
        .gap(1)
        .y(d3.scale.linear().domain([0, 1.5]))
        .x(d3.time.scale().domain([startTime, endTime]));

    dc.renderAll();


}

function initUI() {
    var btn = document.getElementById("set_ip_btn");
    btn.addEventListener("click", function(event) {
        event.preventDefault();
        var input = document.getElementById("device_ip_input");
        sessionStorage.setItem(ADDRESS_LABEL, input.value);
        console.log ("New IP address is updated with " + input.value);
    });

    $("#start_pause_btn")[0].addEventListener("click",function() {
        if ( $("#start_pause_btn")[0].innerHTML === "START") {
            $("#start_pause_btn")[0].innerHTML = "PAUSE";
            dbManager.createNewRecord(document.getElementById("record_name_input").
                value,document.getElementById("frequency_input").value, "http://" + sessionStorage.getItem(ADDRESS_LABEL));
        } else {
            $("#start_pause_btn")[0].innerHTML = "START";
            dbManager.pauseRecord();
        }
    });

    $("#stop_btn")[0].addEventListener("click",function() {
        $("#start_pause_btn")[0].innerHTML = "START";
        dbManager.stopRecord(initUI);
    });

    document.getElementById("create_sample_btn").addEventListener("click", function() {
        dbManager.updateRecordLabel(rangeFilter[0],rangeFilter[1],document.getElementById("sample_name_input").value, function() {
            var name = currentSelectedRow.childNodes[0].innerHTML;
            dbManager.getRecordData(name, initChart);
        })
    });

    document.getElementById("remove_btn").addEventListener("click", function() {
        // remove the current selected record
        if (currentSelectedRow) {
            var name = currentSelectedRow.childNodes[0].innerHTML;

            dbManager.removeRecord(name, function() {
                currentSelectedRow.parentNode.removeChild(currentSelectedRow);
            });

            // remove in record data store
        }
    });

    dbManager.getRecordList(function(recordList) {
        var table = document.getElementById("table_body");
        table.innerHTML = null;
        for (var index =0; index < recordList.length; index++) {
            var value = recordList[index];

            var tr = document.createElement("tr");
            // name
            var td = document.createElement("td");
            td.innerHTML = value.name;
            tr.appendChild(td);
            // start time
            td = document.createElement("td");
            td.innerHTML = new Date(value.startTime);
            tr.appendChild(td);
            // end time
            td = document.createElement("td");
            td.innerHTML = new Date(value.endTime);
            tr.appendChild(td);

            // retrieve actual data
            tr.addEventListener("click", function(e) {
                if (currentSelectedRow) {
                    $(currentSelectedRow).removeClass("selected");
                }

                var tr = e.target.parentNode;
                $(tr).addClass("selected");
                currentSelectedRow = tr;
                var name = currentSelectedRow.childNodes[0].innerHTML;

                dbManager.getRecordData(name, initChart);
            });

            table.appendChild(tr);
        }
    });

}

function init() {
    // dbManager init

    dbManager.init(initUI);
}



