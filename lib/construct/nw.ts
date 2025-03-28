/*
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ Certbot EC2 SSL Stack - Cloud Development Kit nw.ts                                                                                                ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ This construct creates an L2 Construct VPC.                                                                                                        ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
*/
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { vpcProps } from "../../parameter";

export interface INetworkProps extends cdk.StackProps {
  pseudo: cdk.ScopedAws;
  vpcInfo: vpcProps;
}

export class NetworkConstruct extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: INetworkProps) {
    super(scope, id);

    // Availavility Zones
    let azs: string[] = [];
    for (const azType of props.vpcInfo.createAZs) {
      azs.push(props.pseudo.region + azType);
    }

    // Subnet Configuration
    const subnetConfiguration: ec2.SubnetConfiguration[] =
      props.vpcInfo.subnetConfig.map((subnet: any) => ({
        name: subnet.name,
        subnetType: ec2.SubnetType[subnet.type as keyof typeof ec2.SubnetType],
        cidrMask: subnet.cidrMask,
        mapPublicIpOnLaunch: subnet.mapPublicIpFlag,
      }));

    // VPC
    this.vpc = new ec2.Vpc(this, props.vpcInfo.id, {
      vpcName: props.vpcInfo.name,
      ipAddresses: ec2.IpAddresses.cidr(props.vpcInfo.vpcCidr),
      availabilityZones: azs,
      createInternetGateway: props.vpcInfo.createIgwFlag,
      enableDnsHostnames: props.vpcInfo.dnsHostFlag,
      enableDnsSupport: props.vpcInfo.dnsSupportFlag,
      natGateways: props.vpcInfo.createNgwNumber,
      restrictDefaultSecurityGroup: props.vpcInfo.notCreateDefaultSgFlag,
      subnetConfiguration: subnetConfiguration,
    });

    // NetworkACL
    const nacl = new ec2.NetworkAcl(this, "Nacl", {
      vpc: this.vpc,
      networkAclName: "nacl",
      subnetSelection: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });
    nacl.addEntry("NaclAllInboundAllow", {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.INGRESS,
    });
    nacl.addEntry("NaclAllOutboundAllow", {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
    });
  }
}
