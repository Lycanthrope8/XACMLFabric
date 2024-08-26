function formatXML(xmlString) {
          // Normalize newlines, then escape double quotes
          let formatted = xmlString.replace(/[\r\n]+/g, '\\n') // Replace newlines with literal \n
                                   .replace(/\s+/g, ' ')      // Condense spaces
                                   .replace(/"/g, '\\"');      // Escape double quotes
      
          // Ensure we do not remove spaces between attributes and elements
          formatted = formatted.replace(/> </g, '> <'); // Correct spacing between tags if needed
      
          return `"${formatted.trim()}"`;
      }
xmlInput = `<?xml version="1.0" encoding="UTF-8"?>
<Policy xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17"
        PolicyId="ManagementAccessSalaryPolicy"
        RuleCombiningAlgId="urn:oasis:names:tc:xacml:1.0:rule-combining-algorithm:first-applicable"
        Version="1.0">
    <Description>
        Policy to grant read and write access to the salary panel for users with the management role.
    </Description>
    <Target>
        <!-- Define the applicable resource and action -->
        <Resources>
            <Resource>
                <ResourceMatch MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                    <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">salaryPanel</AttributeValue>
                    <ResourceAttributeDesignator AttributeId="urn:oasis:names:tc:xacml:1.0:resource:resource-id"
                                                 DataType="http://www.w3.org/2001/XMLSchema#string"/>
                </ResourceMatch>
            </Resource>
        </Resources>
        <Actions>
            <Action>
                <ActionMatch MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                    <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">read</AttributeValue>
                    <ActionAttributeDesignator AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id"
                                               DataType="http://www.w3.org/2001/XMLSchema#string"/>
                </ActionMatch>
                <ActionMatch MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                    <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">write</AttributeValue>
                    <ActionAttributeDesignator AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id"
                                               DataType="http://www.w3.org/2001/XMLSchema#string"/>
                </ActionMatch>
            </Action>
        </Actions>
    </Target>
    <Rule RuleId="GrantReadAndWriteToManagement"
          Effect="Permit">
        <Description>
            Grant read and write access if the user has the management role.
        </Description>
        <Target>
            <Subjects>
                <Subject>
                    <SubjectMatch MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">management</AttributeValue>
                        <SubjectAttributeDesignator AttributeId="urn:oasis:names:tc:xacml:1.0:subject:subject-role-id"
                                                    DataType="http://www.w3.org/2001/XMLSchema#string"/>
                    </SubjectMatch>
                </Subject>
            </Subjects>
        </Target>
    </Rule>
    <!-- Default Deny Rule -->
    <Rule RuleId="DefaultDeny"
          Effect="Deny"/>
</Policy>
`
const formattedXML = formatXML(xmlInput);
console.log(formattedXML);
      