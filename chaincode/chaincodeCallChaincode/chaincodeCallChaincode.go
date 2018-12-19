// Written by Xu Chen Hao
package main

import (
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
)

var logger = shim.NewLogger("chaincode")

// Define the Smart Contract structure
type SmartContract struct {
}

func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}

func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	// Retrieve the requested Smart Contract function and arguments
	functionName, args := APIstub.GetFunctionAndParameters()

	chaincodeName := args[0]
	channelName := args[1]
	logger.Debugf("Do request to chaincode %s on channel %s", chaincodeName, channelName)
	invokeArgs := toChaincodeArgs(functionName, args[2:])

	response := APIstub.InvokeChaincode(chaincodeName, invokeArgs, channelName)
	if response.Status != shim.OK {
		errStr := fmt.Sprintf("Failed to query chaincode. Got error: %s", response.Payload)
		logger.Error(errStr)
		return shim.Error(errStr)
	}
	return shim.Success(response.Payload)

}

func toChaincodeArgs(functionName string, args []string) [][]byte {
	var fullArgs []string
	fullArgs = append(fullArgs, functionName)
	fullArgs = append(fullArgs, args...)
	bargs := make([][]byte, len(fullArgs))
	for i, arg := range fullArgs {
		bargs[i] = []byte(arg)
	}
	return bargs
}

// The main function is only relevant in unit test mode. Only included here for completeness.
func main() {

	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		logger.Error("Error creating new Smart Contract: %s", err)
	}
}
