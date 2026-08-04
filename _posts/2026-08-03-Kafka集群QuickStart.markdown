---
layout: post
title:  "Kafka集群QuickStart"
category: kafka
tags:
- kafka
---

# 搭建集群

## zk（模拟集群模式，非standalone）

### 预置myid文件

```shell
# 节点1
mkdir -p /tmp/data/zookeeper/data1
echo 1 > /tmp/data/zookeeper/data1/myid
# 节点2
mkdir -p /tmp/data/zookeeper/data2
echo 2 > /tmp/data/zookeeper/data2/myid
# 节点3
mkdir -p /tmp/data/zookeeper/data3
echo 3 > /tmp/data/zookeeper/data3/myid
```

### 修改配置

修改`config/zookeeper.properties`的参数配置，参考：[ZooKeeper: Because Coordinating Distributed Systems is a Zoo](https://zookeeper.apache.org/doc/r3.9.5/zookeeperAdmin.html#sc_configuration)

包括：clientPort / dataDir / maxCnxns /  maxClientCnxns / admin.enableServer / **4lw.commands.whitelist**  等。

另外：

ZK 集群模式下，必须配置额外参数：`tickTime`、`initLimit`、`syncLimit`、`server.X`

计算参考：

- tickTime=2000 → 1 个心跳 = 2 秒
- initLimit=10 → 初始同步最多等待 10*2s=20s
- syncLimit=5 → 正常通信超时 5*2s=10s

以节点1为例（其他节点注意修改`dataDir`和`clientPort`）：

```properties
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# the directory where the snapshot is stored.
dataDir=/tmp/data/zookeeper/data1
# the port at which the clients will connect
clientPort=2181
# disable the per-ip limit on the number of connections since this is a non-production config
maxClientCnxns=0
# Disable the adminserver by default to avoid port conflicts.
# Set the port to something non-conflicting if choosing to enable this
admin.enableServer=true
admin.serverPort=8080

4lw.commands.whitelist=*

## 基础心跳时间（毫秒）
tickTime=2000
## 集群节点初始化同步数据最大心跳数
initLimit=10
## 集群节点之间同步通信最大心跳数
syncLimit=5

# 集群配置格式：server.编号=地址:同步端口:选举端口
server.1=127.0.0.1:2888:3888
server.2=127.0.0.1:2889:3889
server.3=127.0.0.1:2890:3890
```

### 启动zk

```shell
# 确认已经安装jdk
java -version
openjdk version "21.0.11" 2026-04-21
OpenJDK Runtime Environment (build 21.0.11+10-1-24.04.2-Ubuntu)
OpenJDK 64-Bit Server VM (build 21.0.11+10-1-24.04.2-Ubuntu, mixed mode, sharing)
# 若没有jre/java，执行安装
# sudo apt install openjdk-21-jdk-headless

# 启动zk
unset KAFKA_OPTS
nohup ./bin/zookeeper-server-start.sh config/zookeeper1.properties > nohup.zk1.out 2>&1 &
nohup ./bin/zookeeper-server-start.sh config/zookeeper2.properties > nohup.zk2.out 2>&1 &
nohup ./bin/zookeeper-server-start.sh config/zookeeper3.properties > nohup.zk3.out 2>&1 &
```

### 查询启动状态

执行stat/ruok/conf/isro等命令验证

```properties
telnet localhost 2181
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
stat
Zookeeper version: 3.8.4-9316c2a7a97e1666d8f4593f34dd6fc36ecc436c, built on 2024-02-12 22:16 UTC
Clients:
 /127.0.0.1:38058[0](queued=0,recved=1,sent=0)

Latency min/avg/max: 0/0.0/0
Received: 1
Sent: 0
Connections: 1
Outstanding: 0
Zxid: 0x0
Mode: standalone
Node count: 5
Connection closed by foreign host.
```

## kafka

### 修改配置

修改`config/server.properties`，包括broker.id/zookeeper.connect/log.dirs等配置，参考[Configuration | Apache Kafka](https://kafka.apache.org/39/configuration/)

以节点1为例（其他节点注意修改`broker.id`、`listeners`和`log.dirs`）

```properties
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

#
# This configuration file is intended for use in ZK-based mode, where Apache ZooKeeper is required.
# See kafka.server.KafkaConfig for additional details and defaults
#

############################# Server Basics #############################

# The id of the broker. This must be set to a unique integer for each broker.
broker.id=0

############################# Socket Server Settings #############################

# The address the socket server listens on. If not configured, the host name will be equal to the value of
# java.net.InetAddress.getCanonicalHostName(), with PLAINTEXT listener name, and port 9092.
#   FORMAT:
#     listeners = listener_name://host_name:port
#   EXAMPLE:
#     listeners = PLAINTEXT://your.host.name:9092
listeners=PLAINTEXT://:9092

# Listener name, hostname and port the broker will advertise to clients.
# If not set, it uses the value for "listeners".
#advertised.listeners=PLAINTEXT://your.host.name:9092

# Maps listener names to security protocols, the default is for them to be the same. See the config documentation for more details
#listener.security.protocol.map=PLAINTEXT:PLAINTEXT,SSL:SSL,SASL_PLAINTEXT:SASL_PLAINTEXT,SASL_SSL:SASL_SSL

# The number of threads that the server uses for receiving requests from the network and sending responses to the network
num.network.threads=3

# The number of threads that the server uses for processing requests, which may include disk I/O
num.io.threads=8

# The send buffer (SO_SNDBUF) used by the socket server
socket.send.buffer.bytes=102400

# The receive buffer (SO_RCVBUF) used by the socket server
socket.receive.buffer.bytes=102400

# The maximum size of a request that the socket server will accept (protection against OOM)
socket.request.max.bytes=104857600


############################# Log Basics #############################

# A comma separated list of directories under which to store log files
log.dirs=/tmp/kafka-logs/node0

# The default number of log partitions per topic. More partitions allow greater
# parallelism for consumption, but this will also result in more files across
# the brokers.
num.partitions=1

# The number of threads per data directory to be used for log recovery at startup and flushing at shutdown.
# This value is recommended to be increased for installations with data dirs located in RAID array.
num.recovery.threads.per.data.dir=1

############################# Internal Topic Settings  #############################
# The replication factor for the group metadata internal topics "__consumer_offsets" and "__transaction_state"
# For anything other than development testing, a value greater than 1 is recommended to ensure availability such as 3.
offsets.topic.replication.factor=1
transaction.state.log.replication.factor=1
transaction.state.log.min.isr=1

############################# Log Flush Policy #############################

# Messages are immediately written to the filesystem but by default we only fsync() to sync
# the OS cache lazily. The following configurations control the flush of data to disk.
# There are a few important trade-offs here:
#    1. Durability: Unflushed data may be lost if you are not using replication.
#    2. Latency: Very large flush intervals may lead to latency spikes when the flush does occur as there will be a lot of data to flush.
#    3. Throughput: The flush is generally the most expensive operation, and a small flush interval may lead to excessive seeks.
# The settings below allow one to configure the flush policy to flush data after a period of time or
# every N messages (or both). This can be done globally and overridden on a per-topic basis.

# The number of messages to accept before forcing a flush of data to disk
#log.flush.interval.messages=10000

# The maximum amount of time a message can sit in a log before we force a flush
#log.flush.interval.ms=1000

############################# Log Retention Policy #############################

# The following configurations control the disposal of log segments. The policy can
# be set to delete segments after a period of time, or after a given size has accumulated.
# A segment will be deleted whenever *either* of these criteria are met. Deletion always happens
# from the end of the log.

# The minimum age of a log file to be eligible for deletion due to age
log.retention.hours=168

# A size-based retention policy for logs. Segments are pruned from the log unless the remaining
# segments drop below log.retention.bytes. Functions independently of log.retention.hours.
#log.retention.bytes=1073741824

# The maximum size of a log segment file. When this size is reached a new log segment will be created.
#log.segment.bytes=1073741824

# The interval at which log segments are checked to see if they can be deleted according
# to the retention policies
log.retention.check.interval.ms=300000

############################# Zookeeper #############################

# Zookeeper connection string (see zookeeper docs for details).
# This is a comma separated host:port pairs, each corresponding to a zk
# server. e.g. "127.0.0.1:3000,127.0.0.1:3001,127.0.0.1:3002".
# You can also append an optional chroot string to the urls to specify the
# root directory for all kafka znodes.
zookeeper.connect=localhost:2181

# Timeout in ms for connecting to zookeeper
zookeeper.connection.timeout.ms=18000


############################# Group Coordinator Settings #############################

# The following configuration specifies the time, in milliseconds, that the GroupCoordinator will delay the initial consumer rebalance.
# The rebalance will be further delayed by the value of group.initial.rebalance.delay.ms as new members join the group, up to a maximum of max.poll.interval.ms.
# The default value for this is 3 seconds.
# We override this to 0 here as it makes for a better out-of-the-box experience for development and testing.
# However, in production environments the default value of 3 seconds is more suitable as this will help to avoid unnecessary, and potentially expensive, rebalances during application startup.
group.initial.rebalance.delay.ms=0
```

### 启动kafka

```shell
unset KAFKA_OPTS
nohup bin/kafka-server-start.sh config/server.broker0.properties > nohup.broker0.out 2>&1 &
nohup bin/kafka-server-start.sh config/server.broker1.properties > nohup.broker1.out 2>&1 &
nohup bin/kafka-server-start.sh config/server.broker2.properties > nohup.broker2.out 2>&1 &
```

### 查询启动状态

```properties
bin/kafka-broker-api-versions.sh --version
3.9.2

bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092
luocanwei.localdomain:9092 (id: 0 rack: null) -> (
        Produce(0): 0 to 11 [usable: 11],
        Fetch(1): 0 to 17 [usable: 17],
        ListOffsets(2): 0 to 9 [usable: 9],
        Metadata(3): 0 to 12 [usable: 12],
        LeaderAndIsr(4): 0 to 7 [usable: 7],
        StopReplica(5): 0 to 4 [usable: 4],
        UpdateMetadata(6): 0 to 8 [usable: 8],
        ControlledShutdown(7): 0 to 3 [usable: 3],
        OffsetCommit(8): 0 to 9 [usable: 9],
        OffsetFetch(9): 0 to 9 [usable: 9],
        FindCoordinator(10): 0 to 6 [usable: 6],
        JoinGroup(11): 0 to 9 [usable: 9],
        Heartbeat(12): 0 to 4 [usable: 4],
        LeaveGroup(13): 0 to 5 [usable: 5],
        SyncGroup(14): 0 to 5 [usable: 5],
        DescribeGroups(15): 0 to 5 [usable: 5],
        ListGroups(16): 0 to 5 [usable: 5],
        SaslHandshake(17): 0 to 1 [usable: 1],
        ApiVersions(18): 0 to 4 [usable: 4],
        CreateTopics(19): 0 to 7 [usable: 7],
        DeleteTopics(20): 0 to 6 [usable: 6],
        DeleteRecords(21): 0 to 2 [usable: 2],
        InitProducerId(22): 0 to 5 [usable: 5],
        OffsetForLeaderEpoch(23): 0 to 4 [usable: 4],
        AddPartitionsToTxn(24): 0 to 5 [usable: 5],
        AddOffsetsToTxn(25): 0 to 4 [usable: 4],
        EndTxn(26): 0 to 4 [usable: 4],
        WriteTxnMarkers(27): 0 to 1 [usable: 1],
        TxnOffsetCommit(28): 0 to 4 [usable: 4],
        DescribeAcls(29): 0 to 3 [usable: 3],
        CreateAcls(30): 0 to 3 [usable: 3],
        DeleteAcls(31): 0 to 3 [usable: 3],
        DescribeConfigs(32): 0 to 4 [usable: 4],
        AlterConfigs(33): 0 to 2 [usable: 2],
        AlterReplicaLogDirs(34): 0 to 2 [usable: 2],
        DescribeLogDirs(35): 0 to 4 [usable: 4],
        SaslAuthenticate(36): 0 to 2 [usable: 2],
        CreatePartitions(37): 0 to 3 [usable: 3],
        CreateDelegationToken(38): 0 to 3 [usable: 3],
        RenewDelegationToken(39): 0 to 2 [usable: 2],
        ExpireDelegationToken(40): 0 to 2 [usable: 2],
        DescribeDelegationToken(41): 0 to 3 [usable: 3],
        DeleteGroups(42): 0 to 2 [usable: 2],
        ElectLeaders(43): 0 to 2 [usable: 2],
        IncrementalAlterConfigs(44): 0 to 1 [usable: 1],
        AlterPartitionReassignments(45): 0 [usable: 0],
        ListPartitionReassignments(46): 0 [usable: 0],
        OffsetDelete(47): 0 [usable: 0],
        DescribeClientQuotas(48): 0 to 1 [usable: 1],
        AlterClientQuotas(49): 0 to 1 [usable: 1],
        DescribeUserScramCredentials(50): 0 [usable: 0],
        AlterUserScramCredentials(51): 0 [usable: 0],
        DescribeQuorum(55): UNSUPPORTED,
        AlterPartition(56): 0 to 3 [usable: 3],
        UpdateFeatures(57): 0 to 1 [usable: 1],
        Envelope(58): 0 [usable: 0],
        DescribeCluster(60): 0 to 1 [usable: 1],
        DescribeProducers(61): 0 [usable: 0],
        UnregisterBroker(64): UNSUPPORTED,
        DescribeTransactions(65): 0 [usable: 0],
        ListTransactions(66): 0 to 1 [usable: 1],
        AllocateProducerIds(67): 0 [usable: 0],
        ConsumerGroupHeartbeat(68): 0 [usable: 0],
        ConsumerGroupDescribe(69): 0 [usable: 0],
        GetTelemetrySubscriptions(71): UNSUPPORTED,
        PushTelemetry(72): UNSUPPORTED,
        ListClientMetricsResources(74): UNSUPPORTED,
        DescribeTopicPartitions(75): UNSUPPORTED,
        ShareGroupHeartbeat(76): UNSUPPORTED,
        ShareGroupDescribe(77): UNSUPPORTED,
        ShareFetch(78): UNSUPPORTED,
        ShareAcknowledge(79): UNSUPPORTED,
        AddRaftVoter(80): UNSUPPORTED,
        RemoveRaftVoter(81): UNSUPPORTED,
        InitializeShareGroupState(83): UNSUPPORTED,
        ReadShareGroupState(84): UNSUPPORTED,
        WriteShareGroupState(85): UNSUPPORTED,
        DeleteShareGroupState(86): UNSUPPORTED,
        ReadShareGroupStateSummary(87): UNSUPPORTED
)
luocanwei.localdomain:9112 (id: 2 rack: null) -> (
        Produce(0): 0 to 11 [usable: 11],
        Fetch(1): 0 to 17 [usable: 17],
        ListOffsets(2): 0 to 9 [usable: 9],
        Metadata(3): 0 to 12 [usable: 12],
        LeaderAndIsr(4): 0 to 7 [usable: 7],
        StopReplica(5): 0 to 4 [usable: 4],
        UpdateMetadata(6): 0 to 8 [usable: 8],
        ControlledShutdown(7): 0 to 3 [usable: 3],
        OffsetCommit(8): 0 to 9 [usable: 9],
        OffsetFetch(9): 0 to 9 [usable: 9],
        FindCoordinator(10): 0 to 6 [usable: 6],
        JoinGroup(11): 0 to 9 [usable: 9],
        Heartbeat(12): 0 to 4 [usable: 4],
        LeaveGroup(13): 0 to 5 [usable: 5],
        SyncGroup(14): 0 to 5 [usable: 5],
        DescribeGroups(15): 0 to 5 [usable: 5],
        ListGroups(16): 0 to 5 [usable: 5],
        SaslHandshake(17): 0 to 1 [usable: 1],
        ApiVersions(18): 0 to 4 [usable: 4],
        CreateTopics(19): 0 to 7 [usable: 7],
        DeleteTopics(20): 0 to 6 [usable: 6],
        DeleteRecords(21): 0 to 2 [usable: 2],
        InitProducerId(22): 0 to 5 [usable: 5],
        OffsetForLeaderEpoch(23): 0 to 4 [usable: 4],
        AddPartitionsToTxn(24): 0 to 5 [usable: 5],
        AddOffsetsToTxn(25): 0 to 4 [usable: 4],
        EndTxn(26): 0 to 4 [usable: 4],
        WriteTxnMarkers(27): 0 to 1 [usable: 1],
        TxnOffsetCommit(28): 0 to 4 [usable: 4],
        DescribeAcls(29): 0 to 3 [usable: 3],
        CreateAcls(30): 0 to 3 [usable: 3],
        DeleteAcls(31): 0 to 3 [usable: 3],
        DescribeConfigs(32): 0 to 4 [usable: 4],
        AlterConfigs(33): 0 to 2 [usable: 2],
        AlterReplicaLogDirs(34): 0 to 2 [usable: 2],
        DescribeLogDirs(35): 0 to 4 [usable: 4],
        SaslAuthenticate(36): 0 to 2 [usable: 2],
        CreatePartitions(37): 0 to 3 [usable: 3],
        CreateDelegationToken(38): 0 to 3 [usable: 3],
        RenewDelegationToken(39): 0 to 2 [usable: 2],
        ExpireDelegationToken(40): 0 to 2 [usable: 2],
        DescribeDelegationToken(41): 0 to 3 [usable: 3],
        DeleteGroups(42): 0 to 2 [usable: 2],
        ElectLeaders(43): 0 to 2 [usable: 2],
        IncrementalAlterConfigs(44): 0 to 1 [usable: 1],
        AlterPartitionReassignments(45): 0 [usable: 0],
        ListPartitionReassignments(46): 0 [usable: 0],
        OffsetDelete(47): 0 [usable: 0],
        DescribeClientQuotas(48): 0 to 1 [usable: 1],
        AlterClientQuotas(49): 0 to 1 [usable: 1],
        DescribeUserScramCredentials(50): 0 [usable: 0],
        AlterUserScramCredentials(51): 0 [usable: 0],
        DescribeQuorum(55): UNSUPPORTED,
        AlterPartition(56): 0 to 3 [usable: 3],
        UpdateFeatures(57): 0 to 1 [usable: 1],
        Envelope(58): 0 [usable: 0],
        DescribeCluster(60): 0 to 1 [usable: 1],
        DescribeProducers(61): 0 [usable: 0],
        UnregisterBroker(64): UNSUPPORTED,
        DescribeTransactions(65): 0 [usable: 0],
        ListTransactions(66): 0 to 1 [usable: 1],
        AllocateProducerIds(67): 0 [usable: 0],
        ConsumerGroupHeartbeat(68): 0 [usable: 0],
        ConsumerGroupDescribe(69): 0 [usable: 0],
        GetTelemetrySubscriptions(71): UNSUPPORTED,
        PushTelemetry(72): UNSUPPORTED,
        ListClientMetricsResources(74): UNSUPPORTED,
        DescribeTopicPartitions(75): UNSUPPORTED,
        ShareGroupHeartbeat(76): UNSUPPORTED,
        ShareGroupDescribe(77): UNSUPPORTED,
        ShareFetch(78): UNSUPPORTED,
        ShareAcknowledge(79): UNSUPPORTED,
        AddRaftVoter(80): UNSUPPORTED,
        RemoveRaftVoter(81): UNSUPPORTED,
        InitializeShareGroupState(83): UNSUPPORTED,
        ReadShareGroupState(84): UNSUPPORTED,
        WriteShareGroupState(85): UNSUPPORTED,
        DeleteShareGroupState(86): UNSUPPORTED,
        ReadShareGroupStateSummary(87): UNSUPPORTED
)
luocanwei.localdomain:9102 (id: 1 rack: null) -> (
        Produce(0): 0 to 11 [usable: 11],
        Fetch(1): 0 to 17 [usable: 17],
        ListOffsets(2): 0 to 9 [usable: 9],
        Metadata(3): 0 to 12 [usable: 12],
        LeaderAndIsr(4): 0 to 7 [usable: 7],
        StopReplica(5): 0 to 4 [usable: 4],
        UpdateMetadata(6): 0 to 8 [usable: 8],
        ControlledShutdown(7): 0 to 3 [usable: 3],
        OffsetCommit(8): 0 to 9 [usable: 9],
        OffsetFetch(9): 0 to 9 [usable: 9],
        FindCoordinator(10): 0 to 6 [usable: 6],
        JoinGroup(11): 0 to 9 [usable: 9],
        Heartbeat(12): 0 to 4 [usable: 4],
        LeaveGroup(13): 0 to 5 [usable: 5],
        SyncGroup(14): 0 to 5 [usable: 5],
        DescribeGroups(15): 0 to 5 [usable: 5],
        ListGroups(16): 0 to 5 [usable: 5],
        SaslHandshake(17): 0 to 1 [usable: 1],
        ApiVersions(18): 0 to 4 [usable: 4],
        CreateTopics(19): 0 to 7 [usable: 7],
        DeleteTopics(20): 0 to 6 [usable: 6],
        DeleteRecords(21): 0 to 2 [usable: 2],
        InitProducerId(22): 0 to 5 [usable: 5],
        OffsetForLeaderEpoch(23): 0 to 4 [usable: 4],
        AddPartitionsToTxn(24): 0 to 5 [usable: 5],
        AddOffsetsToTxn(25): 0 to 4 [usable: 4],
        EndTxn(26): 0 to 4 [usable: 4],
        WriteTxnMarkers(27): 0 to 1 [usable: 1],
        TxnOffsetCommit(28): 0 to 4 [usable: 4],
        DescribeAcls(29): 0 to 3 [usable: 3],
        CreateAcls(30): 0 to 3 [usable: 3],
        DeleteAcls(31): 0 to 3 [usable: 3],
        DescribeConfigs(32): 0 to 4 [usable: 4],
        AlterConfigs(33): 0 to 2 [usable: 2],
        AlterReplicaLogDirs(34): 0 to 2 [usable: 2],
        DescribeLogDirs(35): 0 to 4 [usable: 4],
        SaslAuthenticate(36): 0 to 2 [usable: 2],
        CreatePartitions(37): 0 to 3 [usable: 3],
        CreateDelegationToken(38): 0 to 3 [usable: 3],
        RenewDelegationToken(39): 0 to 2 [usable: 2],
        ExpireDelegationToken(40): 0 to 2 [usable: 2],
        DescribeDelegationToken(41): 0 to 3 [usable: 3],
        DeleteGroups(42): 0 to 2 [usable: 2],
        ElectLeaders(43): 0 to 2 [usable: 2],
        IncrementalAlterConfigs(44): 0 to 1 [usable: 1],
        AlterPartitionReassignments(45): 0 [usable: 0],
        ListPartitionReassignments(46): 0 [usable: 0],
        OffsetDelete(47): 0 [usable: 0],
        DescribeClientQuotas(48): 0 to 1 [usable: 1],
        AlterClientQuotas(49): 0 to 1 [usable: 1],
        DescribeUserScramCredentials(50): 0 [usable: 0],
        AlterUserScramCredentials(51): 0 [usable: 0],
        DescribeQuorum(55): UNSUPPORTED,
        AlterPartition(56): 0 to 3 [usable: 3],
        UpdateFeatures(57): 0 to 1 [usable: 1],
        Envelope(58): 0 [usable: 0],
        DescribeCluster(60): 0 to 1 [usable: 1],
        DescribeProducers(61): 0 [usable: 0],
        UnregisterBroker(64): UNSUPPORTED,
        DescribeTransactions(65): 0 [usable: 0],
        ListTransactions(66): 0 to 1 [usable: 1],
        AllocateProducerIds(67): 0 [usable: 0],
        ConsumerGroupHeartbeat(68): 0 [usable: 0],
        ConsumerGroupDescribe(69): 0 [usable: 0],
        GetTelemetrySubscriptions(71): UNSUPPORTED,
        PushTelemetry(72): UNSUPPORTED,
        ListClientMetricsResources(74): UNSUPPORTED,
        DescribeTopicPartitions(75): UNSUPPORTED,
        ShareGroupHeartbeat(76): UNSUPPORTED,
        ShareGroupDescribe(77): UNSUPPORTED,
        ShareFetch(78): UNSUPPORTED,
        ShareAcknowledge(79): UNSUPPORTED,
        AddRaftVoter(80): UNSUPPORTED,
        RemoveRaftVoter(81): UNSUPPORTED,
        InitializeShareGroupState(83): UNSUPPORTED,
        ReadShareGroupState(84): UNSUPPORTED,
        WriteShareGroupState(85): UNSUPPORTED,
        DeleteShareGroupState(86): UNSUPPORTED,
        ReadShareGroupStateSummary(87): UNSUPPORTED
)
```

## 停止所有kafka进程

```shell
ps -ef | grep kafka | grep -v grep| awk '{print $2}' | xargs kill -15
```

## 常用命令

### 准备工作

#### Windows 访问 WSL 的 zk 2181

```shell
# WSL 内执行，获取 WSL IP
hostname -I
## 示例输出 172.30.240.162

# Windows cmd/powershell 测试连通性
telnet 172.30.240.162 2181
```

#### WSL 内访问 Windows 上的服务

```shell
# WSL 内执行，获取windows主机ip
ip route show default | awk '{print $3}'
```

### kafka-topic.sh，Topic管理

参考 [Basic Kafka Operations | Apache Kafka](https://kafka.apache.org/39/operations/basic-kafka-operations/)

#### 创建Topic

```shell
bin/kafka-topics.sh --create --bootstrap-server localhost:9092,localhost:9102,localhost:9112 --replication-factor 2 --partitions 1 --topic test
Created topic test.
```

![topic_state](/assets/kafka/topic_state.png)

#### 查询Topic列表

```shell
bin/kafka-topics.sh --list --bootstrap-server localhost:9092
# 查询te开头的所有Topic列表
bin/kafka-topics.sh --bootstrap-server localhost:9092 --list --exclude-internal --topic "te.*"
```

#### 描述Topic配置

```shell
bin/kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic test
Topic: test     TopicId: MunTKTpCTUi8mCliH-U29w PartitionCount: 1       ReplicationFactor: 2    Configs:
        Topic: test     Partition: 0    Leader: 2       Replicas: 2,0   Isr: 2,0        Elr: N/A        LastKnownElr: N/A
# 查询__consumer_offsets
bin/kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic __consumer_offsets

# 批量查询
bin/kafka-topics.sh --topic "te.*" --bootstrap-server localhost:9092 --describe --exclude-internal
```

#### 删除Topic

```shell
bin/kafka-topics.sh  --bootstrap-server localhost:9092 --delete --topic test
```

#### Topic扩容

```shell
bin/kafka-topics.sh --bootstrap-server localhost:9092 --alter --topic test --partitions 2
# 批量扩容
bin/kafka-topics.sh --topic ".*?" --bootstrap-server localhost:9092 --alter --partitions 3
```

### kafka-console-producer.sh，生产者

#### 发送消息

```shell
bin/kafka-console-producer.sh --broker-list localhost:9092 --topic test
# 发送消息，指定生产者参数 acks 为 -1，同时启用 LZ4 的压缩算法：
bin/kafka-console-producer.sh --broker-list localhost:9092 --topic test --request-required-acks -1 --producer-property compression.type=lz4
# 当设置acks=-1时，Partition Leader接收到消息之后，还必须要求ISR列表里跟Leader保持同步的那些Follower都要把消息同步过去，才能认为这条消息是写入成功。
```

### kafka-console-consumer.sh，消费者

#### 消费消息

```shell
# 从头开始消费（--from-beginning参数表示从该主题最早的位移开始消费）
bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test --from-beginning

# 指定消费组
bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test --from-beginning  --group  group01

# 消费指定数量的消息
bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test --from-beginning  --max-messages 2
```

#### 直接读取该主题消息

比如，查看消费偏移量

```shell
bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic __consumer_offsets --formatter "org.apache.kafka.tools.consumer.OffsetsMessageFormatter" --from-beginning
```

```json
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":0}},"value":{"version":3,"data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773255526}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":1}},"value":{"version":3,"data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773255526}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":0}},"value":{"version":3,"data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773260522}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":1}},"value":{"version":3,"data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773260522}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":0}},"value":{"version":3,"data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773265521}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":1}},"value":{"version":3,"data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773265521}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":0}},"value":{"version":3,"data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773270522}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":1}},"value":{"version":3,"data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773270522}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":0}},"value":{"version":3,"data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773275522}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":1}},"value":{"version":3,"data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773275522}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":0}},"value":{"version":3,"data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773280521}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":1}},"value":{"version":3,"data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773280521}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":0}},"value":{"version":3,"data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773285521}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":1}},"value":{"version":3,"data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773285521}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":0}},"value":{"version":3,"data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773290521}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":1}},"value":{"version":3,"data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773290521}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":0}},"value":{"version":3,"data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773295521}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":1}},"value":{"version":3,"data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773295521}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":0}},"value":{"version":3,"data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773300522}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":1}},"value":{"version":3,"data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773300522}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":0}},"value":{"version":3,"data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773305523}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":1}},"value":{"version":3,"data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773305523}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":0}},"value":{"version":3,"data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773310522}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":1}},"value":{"version":3,"data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773310522}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":0}},"value":{"version":3,"data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773315522}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":1}},"value":{"version":3,"data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773315522}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":0}},"value":{"version":3,"data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773320523}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":1}},"value":{"version":3,"data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773320523}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":0}},"value":{"version":3,"data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773325523}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":1}},"value":{"version":3,"data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773325523}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":0}},"value":{"version":3,"data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773330524}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":1}},"value":{"version":3,"data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773330524}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":0}},"value":{"version":3,"data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773335524}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":1}},"value":{"version":3,"data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773335524}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":0}},"value":{"version":3,"data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773340525}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":1}},"value":{"version":3,"data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773340525}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":0}},"value":{"version":3,"data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773345526}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":1}},"value":{"version":3,"data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773345526}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":0}},"value":{"version":3,"data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773348400}}}
{"key":{"version":1,"data":{"group":"group01","topic":"test","partition":1}},"value":{"version":3,"data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773348400}}}
```

#### 读取消息时间

```shell
bin/kafka-console-consumer.sh \
--bootstrap-server localhost:9092 \
--topic test \
--from-beginning \
--property print.timestamp=true \
--property print.offset=true \
--property print.key=true

CreateTime:1785772164675        Offset:0        null    a
CreateTime:1785772164705        Offset:1        null    b
CreateTime:1785772164706        Offset:2        null    c
CreateTime:1785772812310        Offset:3        null    ddd
CreateTime:1785772817026        Offset:4        null    facd
```



### kafka-consumer-groups.sh，消费组

#### 查看消费组

```shell
# 查看消费组列表
bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list --state
GROUP                            STATE
console-consumer-73803           Empty
group01                          Empty

# 查看指定消费组
bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group group01 --verbose

Consumer group 'group01' has no active members.

GROUP           TOPIC           PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG             CONSUMER-ID     HOST            CLIENT-ID
group01         test            1          0               0               0               -               -               -
group01         test            0          5               5               0               -               -               -
```

#### 重置消费组偏移量

##### 到指定时间

```shell
# 把主题 test 的 消费者组group01的offset 重置到2026-08-04T00:00:00.000+0800
bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group group01 --topic test --reset-offsets --to-datetime 2026-08-04T00:00:12.000+0800 --execute
```

比如通过`print.timestamp=true`或`kafka-dump-log.sh`查到期间的某条消息的时间戳为`1785772164706`

```shell
date -d @$((1785772164706/1000)) +"%Y-%m-%dT%H:%M:%S.000+0800"
2026-08-03T23:49:24.000+0800

## 重置偏移量
bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group group01 --topic test --reset-offsets --to-datetime 2026-08-03T23:49:25.000+0800 --execute

Warn: Partition 1 from topic test is empty. Falling back to latest known offset.

GROUP                          TOPIC                          PARTITION  NEW-OFFSET
group01                        test                           1          0              
group01                        test                           0          3 

bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group group01

Consumer group 'group01' has no active members.

GROUP           TOPIC           PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG             CONSUMER-ID     HOST            CLIENT-ID
group01         test            1          0               0               0               -               -               -
group01         test            0          3               5               2               -               -               -
```

##### 到指定位置

offset->2

```shell
bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group group01 --topic test --reset-offsets --to-offset 2 --execute
[2026-08-04 01:22:47,769] WARN New offset (2) is higher than latest offset for topic partition test-1. Value will be set to 0 (org.apache.kafka.tools.consumer.group.ConsumerGroupCommand)

GROUP                          TOPIC                          PARTITION  NEW-OFFSET
group01                        test                           1          0              
group01                        test                           0          2

bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group group01

Consumer group 'group01' has no active members.

GROUP           TOPIC           PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG             CONSUMER-ID     HOST            CLIENT-ID
group01         test            1          0               0               0               -               -               -
group01         test            0          2               5               3               -               -               -
```



### kafka-dump-log.sh，导出日志

#### 导出偏移量消息（--offsets-decoder）

```shell
bin/kafka-dump-log.sh --files /tmp/kafka-logs/node1/__consumer_offsets-42/00000000000000000000.log --offsets-decoder | head
Dumping /tmp/kafka-logs/node1/__consumer_offsets-42/00000000000000000000.log

Log starting offset: 0

baseOffset: 0 lastOffset: 0 count: 1 baseSequence: -1 lastSequence: -1 producerId: -1 producerEpoch: -1 partitionLeaderEpoch: 0 isTransactional: false isControl: false deleteHorizonMs: OptionalLong.empty position: 0 CreateTime: 1785773250466 size: 328 magic: 2 compresscodec: none crc: 4023593851 isvalid: true
| offset: 0 CreateTime: 1785773250466 keySize: 11 valueSize: 247 sequence: -1 headerKeys: [] key: {"type":"2","data":{"group":"group01"}} payload: {"version":"3","data":{"protocolType":"consumer","generation":1,"protocol":"range","leader":"console-consumer-e33d37af-ded5-41c1-aeb3-05d12b5df4bf","currentStateTimestamp":1785773250437,"members":[{"memberId":"console-consumer-e33d37af-ded5-41c1-aeb3-05d12b5df4bf","groupInstanceId":null,"clientId":"console-consumer","clientHost":"/127.0.0.1","rebalanceTimeout":300000,"sessionTimeout":45000,"subscription":{"topics":["test"],"userData":null,"ownedPartitions":[],"generationId":-1,"rackId":null},"assignment":{"assignedPartitions":[{"topic":"test","partitions":[0,1]}],"userData":null}}]}}

baseOffset: 1 lastOffset: 2 count: 2 baseSequence: 0 lastSequence: 1 producerId: -1 producerEpoch: -1 partitionLeaderEpoch: 0 isTransactional: false isControl: false deleteHorizonMs: OptionalLong.empty position: 328 CreateTime: 1785773255530 size: 165 magic: 2 compresscodec: none crc: 641063234 isvalid: true
| offset: 1 CreateTime: 1785773255530 keySize: 21 valueSize: 24 sequence: 0 headerKeys: [] key: {"type":"1","data":{"group":"group01","topic":"test","partition":0}} payload: {"version":"3","data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773255526}}
| offset: 2 CreateTime: 1785773255530 keySize: 21 valueSize: 24 sequence: 1 headerKeys: [] key: {"type":"1","data":{"group":"group01","topic":"test","partition":1}} payload: {"version":"3","data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773255526}}

baseOffset: 3 lastOffset: 4 count: 2 baseSequence: 0 lastSequence: 1 producerId: -1 producerEpoch: -1 partitionLeaderEpoch: 0 isTransactional: false isControl: false deleteHorizonMs: OptionalLong.empty position: 493 CreateTime: 1785773260522 size: 165 magic: 2 compresscodec: none crc: 2462831172 isvalid: true
| offset: 3 CreateTime: 1785773260522 keySize: 21 valueSize: 24 sequence: 0 headerKeys: [] key: {"type":"1","data":{"group":"group01","topic":"test","partition":0}} payload: {"version":"3","data":{"offset":5,"leaderEpoch":0,"metadata":"","commitTimestamp":1785773260522}}
| offset: 4 CreateTime: 1785773260522 keySize: 21 valueSize: 24 sequence: 1 headerKeys: [] key: {"type":"1","data":{"group":"group01","topic":"test","partition":1}} payload: {"version":"3","data":{"offset":0,"leaderEpoch":-1,"metadata":"","commitTimestamp":1785773260522}}
```



#### 导出消息数据（--print-data-log）

```shell
bin/kafka-dump-log.sh --files /tmp/kafka-logs/node0/test-0/00000000000000000000.log --print-data-log
Dumping /tmp/kafka-logs/node0/test-0/00000000000000000000.log

Log starting offset: 0
baseOffset: 0 lastOffset: 2 count: 3 baseSequence: 0 lastSequence: 2 producerId: 0 producerEpoch: 0 partitionLeaderEpoch: 0 isTransactional: false isControl: false deleteHorizonMs: OptionalLong.empty position: 0 CreateTime: 1785772164706 size: 85 magic: 2 compresscodec: none crc: 4143386110 isvalid: true
| offset: 0 CreateTime: 1785772164675 keySize: -1 valueSize: 1 sequence: 0 headerKeys: [] payload: a
| offset: 1 CreateTime: 1785772164705 keySize: -1 valueSize: 1 sequence: 1 headerKeys: [] payload: b
| offset: 2 CreateTime: 1785772164706 keySize: -1 valueSize: 1 sequence: 2 headerKeys: [] payload: c

baseOffset: 3 lastOffset: 3 count: 1 baseSequence: 0 lastSequence: 0 producerId: 1 producerEpoch: 0 partitionLeaderEpoch: 0 isTransactional: false isControl: false deleteHorizonMs: OptionalLong.empty position: 85 CreateTime: 1785772812310 size: 71 magic: 2 compresscodec: none crc: 4240895373 isvalid: true
| offset: 3 CreateTime: 1785772812310 keySize: -1 valueSize: 3 sequence: 0 headerKeys: [] payload: ddd

baseOffset: 4 lastOffset: 4 count: 1 baseSequence: 1 lastSequence: 1 producerId: 1 producerEpoch: 0 partitionLeaderEpoch: 0 isTransactional: false isControl: false deleteHorizonMs: OptionalLong.empty position: 156 CreateTime: 1785772817026 size: 72 magic: 2 compresscodec: none crc: 140768607 isvalid: true
| offset: 4 CreateTime: 1785772817026 keySize: -1 valueSize: 4 sequence: 1 headerKeys: [] payload: facd
```



### kafka-producer-perf-test.sh，生产性能测试

```shell
bin/kafka-producer-perf-test.sh --topic test --num-records 5000000 --throughput -1 --record-size 200 --producer-props bootstrap.servers=localhost:9092 acks=1 linger.ms=50
```

### kafka-consumer-perf-test.sh，消费者性能测试

```shell
bin/kafka-consumer-perf-test.sh --broker-list localhost:9092 --messages 5000000 --topic test
```



### 计算消息数

```shell
# -2  → earliest EARLIEST_TIMESTAMP 分区最小offset（第一条消息位置）
bin/kafka-run-class.sh org.apache.kafka.tools.GetOffsetShell --broker-list localhost:9092 --topic test --time -2
test:0:0
test:1:0

# -1  → latest   LATEST_TIMESTAMP  分区下一条待写入offset（最新offset，当前最后一条消息offset = 返回值 -1）
bin/kafka-run-class.sh org.apache.kafka.tools.GetOffsetShell --broker-list localhost:9092 --topic test --time -1
test:0:5
test:1:0
```



