import { Component, OnInit } from "@angular/core";

import { IGraphNode, MeasurementInfo, MeasurementUnits, NodeType } from "@cxss/interfaces";

@Component({
  selector: "ui-testbed",
  templateUrl: "./testbed.component.html",
  styleUrls: ["./testbed.component.scss"],
})
export class TestbedComponent implements OnInit {
  textString: string = "cass";
  numberString: number = 1;
  boolString: boolean = true;

  measurements = MeasurementInfo;
  units = MeasurementUnits;

  graph:IGraphNode[] = [
    {
      name: "parent",
      _id: "1",
      type: NodeType.Farm,
      children: [
        {
          name: "child",
          _id: "2",
          type: NodeType.Rack,
          children: [
            {
              name: "child",
              _id: "11",
              type: NodeType.Rack,
            },
            {
              name: "child 7",
              _id: "12",
              type: NodeType.Rack,
              children: [
                {
                  name: "child",
                  _id: "14",
                  type: NodeType.Rack,
                },
                {
                  name: "child 7",
                  _id: "15",
                  type: NodeType.Rack,
                  children: [
                    {
                      name: "child",
                      _id: "16",
                      type: NodeType.Rack,
                    },
                    {
                      name: "child 7",
                      _id: "17",
                      type: NodeType.Rack,
                    }
                  ]    
        
                }
              ]    
    
            }
          ]    
        },
        {
          name: "child 7",
          _id: "7",
          type: NodeType.Rack,
        }
      ]
    },
    {
      name: "parent 2",
      _id: "3",
      type: NodeType.Farm,
      children: [
        {
          name: "child 2",
          _id: "4",
          type: NodeType.Rack,
        }
      ]
    }

  ]

  constructor() {}

  ngOnInit(): void {}
}
